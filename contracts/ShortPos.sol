// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

import './interfaces/Tectonic/TErc20Interface.sol';
import './interfaces/Tectonic/TectonicCoreInterface.sol';
import './interfaces/Tectonic/TectonicOracleAdapter.sol';
import './interfaces/VVS/VVSRouter02.sol';
import './ShortPosStorage.sol';
import './libs/SwapCenter.sol';
import './token/Short.sol';

contract ShortPos is ShortPosStorage, Ownable {
  using SafeERC20 for IERC20;
  using SafeMath for uint256; // cover overflow

  address[] public markets;
  mapping(address => address) public marketsMapping;
  mapping(address => uint256) public orderIds;
  mapping(address => Order[]) public OrdersMapping;
  mapping(address => mapping(uint256 => Order)) public OrdersIdMapping;

  struct Order {
    uint256 id;
    address shortToken;
    address collateralToken;
    uint256 shortTokenAmount;
    uint256 collateralAmount;
    uint256 tCollateralAmount;
    uint256 certificateTokenAmount;
  }

  event CreateShort(address indexed user, Order order);
  event RedeemShort(address indexed user, uint256 orderId);

  Short public immutable shortToken;
  VVSRouter02 vvsRouter;
  TectonicCoreInterface tectonic;
  TectonicOracleAdapter oracle;

  constructor(
    address _shortToken,
    address _tectonic, // address tectonic
    address _vvs, // address vvs
    address _oracleAddress // address tectonicOracle
  ) {
    shortToken = Short(_shortToken);
    tectonic = TectonicCoreInterface(_tectonic);
    vvsRouter = VVSRouter02(_vvs);
    oracle = TectonicOracleAdapter(_oracleAddress);
  }

  function _initialize(address[][] calldata _tokens) external onlyOwner {
    for (uint256 i; i < _tokens.length; i++) {
      address tokenAddr = _tokens[i][0];
      address tTokenAddr = _tokens[i][1];
      marketsMapping[tokenAddr] = tTokenAddr;
    }
  }

  function createShortPos(
    address _shortToken,
    uint256 _shortAmount,
    address collateralToken
  ) external payable {
    // todo require

    address tToken = marketsMapping[_shortToken];
    address tCollateralToken = marketsMapping[collateralToken];

    // eg: tWETH
    uint256 shortTokenPriceFeed = oracle.getUnderlyingPrice(marketsMapping[_shortToken]);
    // eg: tUSDC
    uint256 collateralPriceFeed = oracle.getUnderlyingPrice(tCollateralToken);

    // in order to get enough collateral for the short position
    // eg: USDC Amount needed
    uint256 collateralAmount = _shortAmount.mul(shortTokenPriceFeed).mul(2).div(collateralPriceFeed);

    // ① Supply the collateral and get the tToken from Tectonic
    uint256 tCollateralAmount = _enterMarketToSupplyCollateral(tCollateralToken, collateralToken, collateralAmount);

    // ② Borrow the short position
    (, , uint256 borrowedBalanceBefore, ) = TErc20Interface(tToken).getAccountSnapshot(address(this));
    // msg.sender: The account to which borrowed funds shall be transferred.
    // borrowAmount : The amount of the underlying asset to be borrowed.
    require(TErc20Interface(tToken).borrow(_shortAmount) == 0, 'borrow failed');
    (, , uint256 borrowedBalanceAfter, ) = TErc20Interface(tToken).getAccountSnapshot(address(this));

    uint256 borrowedAmount = borrowedBalanceAfter.sub(borrowedBalanceBefore);

    // ③ Swap the short token for the collateral token
    uint256 swappedTokenAmount = SwapCenter.swapExactTokenForToken(_shortToken, _shortAmount, collateralToken);

    Order memory order;
    uint256 orderId = _getUniqueId();
    order.id = orderId;
    order.shortToken = _shortToken;
    order.shortTokenAmount = borrowedAmount;
    order.collateralToken = collateralToken;
    order.collateralAmount = collateralAmount;
    order.tCollateralAmount = tCollateralAmount;
    order.certificateTokenAmount = swappedTokenAmount;
    OrdersMapping[msg.sender].push(order);
    OrdersIdMapping[msg.sender][orderId] = order;

    // ④ Short position certificate sent to the user (rate is 1:1 for simplicity)
    shortToken.mint(msg.sender, swappedTokenAmount);

    emit CreateShort(msg.sender, order);
  }

  function _enterMarketToSupplyCollateral(
    address _tCollateralToken,
    address _collateralToken,
    uint256 _collateralAmount
  ) private returns (uint256) {
    // transfer collateral to the Contract
    _checkAllowance(_collateralToken, msg.sender, address(this), _collateralAmount);

    IERC20(_collateralToken).safeTransferFrom(msg.sender, address(this), _collateralAmount);

    _checkAllowance(_collateralToken, address(this), _tCollateralToken, _collateralAmount);

    // Enter markets first in order to supply collateral or borrow in a market
    markets.push(_tCollateralToken);
    uint256[] memory errors = tectonic.enterMarkets(markets);
    for (uint256 i = 0; i < errors.length; i++) {
      assert(errors[i] == 0);
    }

    // mint tToken to the Contract
    (, uint256 tCollateralTokenBalanceBefore, , ) = TErc20Interface(_tCollateralToken).getAccountSnapshot(
      address(this)
    );
    // Before supplying an asset, users must first approve the cToken to access their token balance.
    // msg.sender: The account which shall supply the asset, and own the minted cTokens.
    // mintAmount: The amount of the asset to be supplied, in units of the underlying asset.
    // The mint function transfers an asset into the protocol, which begins accumulating interest based on the current Supply Rate for the asset. The user receives a quantity of cTokens equal to the underlying tokens supplied, divided by the current Exchange Rate.
    require(TErc20Interface(_tCollateralToken).mint(_collateralAmount) == 0, 'mint failed');

    (, uint256 tCollateralTokenBalanceAfter, , ) = TErc20Interface(_tCollateralToken).getAccountSnapshot(address(this));

    return tCollateralTokenBalanceAfter.sub(tCollateralTokenBalanceBefore);
  }

  // Useful for calculating optimal token amounts before calling swap

  function redeem(uint256 orderId) external {
    Order memory order = OrdersIdMapping[msg.sender][orderId];

    // burn the certificate token
    shortToken.burn(msg.sender, order.certificateTokenAmount);

    // swap the collateral token for the short token
    // Check the amount of collateral Token will be needed to exchange for enough short Token
    address[] memory path = new address[](2);
    // eg: USDC ---swap---> ETH
    path[0] = order.collateralToken;
    path[1] = order.shortToken;
    uint256[] memory collateralAmountNeededList = vvsRouter.getAmountsIn(order.shortTokenAmount, path);

    _checkAllowance(order.collateralToken, address(this), address(vvsRouter), order.shortTokenAmount);

    // If the shorting strategy is successful, will be able to exchange all of the Short Token, conversely will exchange as much of the Short Token as possible

    // If the current swappedTokenAmount balance is not enough to get back the desired amount of short token
    uint256 swappedBackShortTokenAmount;
    uint256 remainingCollateralAmount;
    if (order.certificateTokenAmount < collateralAmountNeededList[0]) {
      uint256[] memory amounts = vvsRouter.swapExactTokensForTokens(
        order.certificateTokenAmount,
        0,
        path,
        address(this),
        block.timestamp + 5 minutes
      );
      swappedBackShortTokenAmount = amounts[amounts.length - 1];
    } else {
      // Enough swappedTokenAmount to get back the desired amount of short token
      uint256[] memory amounts = vvsRouter.swapTokensForExactTokens(
        order.shortTokenAmount, // amount out
        order.certificateTokenAmount, // amount in max
        path,
        address(this),
        block.timestamp + 5 minutes
      );

      // A value of -1 (i.e. 2256 - 1) can be used to repay the full amount
      swappedBackShortTokenAmount = order.shortTokenAmount;
      remainingCollateralAmount = order.shortTokenAmount.sub(amounts[0]);
    }

    _checkAllowance(order.shortToken, address(this), marketsMapping[order.shortToken], swappedBackShortTokenAmount);

    // Repay borrrowed amount to Tectonic
    TErc20Interface(marketsMapping[order.shortToken]).repayBorrow(swappedBackShortTokenAmount);

    // get the shortfall amount
    (, , uint256 shortfall) = tectonic.getHypotheticalAccountLiquidity(
      address(this),
      marketsMapping[order.collateralToken],
      order.tCollateralAmount,
      0
    );

    uint256 collateralBefore = IERC20(order.collateralToken).balanceOf(address(this));
    TErc20Interface(marketsMapping[order.collateralToken]).redeem(order.tCollateralAmount - shortfall.div(10**8));
    uint256 collateralAfter = IERC20(order.collateralToken).balanceOf(address(this));
    uint256 collateralPayBackAmount = collateralAfter - collateralBefore;

    // payback to user
    IERC20(order.collateralToken).safeTransfer(msg.sender, collateralPayBackAmount + remainingCollateralAmount);

    emit RedeemShort(msg.sender, orderId);
  }

  function getAllOrdersByUser(address _user) public view returns (Order[] memory) {
    return OrdersMapping[_user];
  }

  function _checkAllowance(
    address _token,
    address _owner,
    address _spender,
    uint256 _usedAmount
  ) private {
    if (IERC20(_token).allowance(_owner, _spender) < _usedAmount) {
      IERC20(_token).safeApprove(_spender, type(uint256).max);
    }
  }

  function _getUniqueId() private returns (uint256) {
    uint256 id = orderIds[msg.sender] = 1;
    orderIds[msg.sender]++;

    return id;
  }

  receive() external payable {}
}
