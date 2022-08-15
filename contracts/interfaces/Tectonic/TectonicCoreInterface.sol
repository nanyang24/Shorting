pragma solidity >=0.5.16;

interface TectonicCoreInterface {
  function getHypotheticalAccountLiquidity(
    address account,
    address tTokenModify,
    uint256 redeemTokens,
    uint256 borrowAmount
  )
    external
    view
    returns (
      uint256,
      uint256,
      uint256
    );

  /*** Assets You Are In ***/

  function enterMarkets(address[] calldata tTokens) external returns (uint256[] memory);

  function exitMarket(address tToken) external returns (uint256);

  /*** Policy Hooks ***/

  function mintAllowed(
    address tToken,
    address minter,
    uint256 mintAmount
  ) external returns (uint256);

  function mintVerify(
    address tToken,
    address minter,
    uint256 mintAmount,
    uint256 mintTokens
  ) external;

  function redeemAllowed(
    address tToken,
    address redeemer,
    uint256 redeemTokens
  ) external returns (uint256);

  function redeemVerify(
    address tToken,
    address redeemer,
    uint256 redeemAmount,
    uint256 redeemTokens
  ) external;

  function borrowAllowed(
    address tToken,
    address borrower,
    uint256 borrowAmount
  ) external returns (uint256);

  function borrowVerify(
    address tToken,
    address borrower,
    uint256 borrowAmount
  ) external;

  function repayBorrowAllowed(
    address tToken,
    address payer,
    address borrower,
    uint256 repayAmount
  ) external returns (uint256);

  function repayBorrowVerify(
    address tToken,
    address payer,
    address borrower,
    uint256 repayAmount,
    uint256 borrowerIndex
  ) external;

  function liquidateBorrowAllowed(
    address tTokenBorrowed,
    address tTokenCollateral,
    address liquidator,
    address borrower,
    uint256 repayAmount
  ) external returns (uint256);

  function liquidateBorrowVerify(
    address tTokenBorrowed,
    address tTokenCollateral,
    address liquidator,
    address borrower,
    uint256 repayAmount,
    uint256 seizeTokens
  ) external;

  function seizeAllowed(
    address tTokenCollateral,
    address tTokenBorrowed,
    address liquidator,
    address borrower,
    uint256 seizeTokens
  ) external returns (uint256);

  function seizeVerify(
    address tTokenCollateral,
    address tTokenBorrowed,
    address liquidator,
    address borrower,
    uint256 seizeTokens
  ) external;

  function transferAllowed(
    address tToken,
    address src,
    address dst,
    uint256 transferTokens
  ) external returns (uint256);

  function transferVerify(
    address tToken,
    address src,
    address dst,
    uint256 transferTokens
  ) external;

  /*** Liquidity/Liquidation Calculations ***/

  function liquidateCalculateSeizeTokens(
    address tTokenBorrowed,
    address tTokenCollateral,
    uint256 repayAmount
  ) external view returns (uint256, uint256);
}
