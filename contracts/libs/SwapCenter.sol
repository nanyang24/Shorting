// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import '../interfaces/VVS/VVSRouter02.sol';

library SwapCenter {
  using SafeERC20 for IERC20;

  address constant VVSContractRouterAddr = 0x145863Eb42Cf62847A6Ca784e6416C1682b1b2Ae;

  function swapExactTokenForToken(
    address originToken,
    uint256 originTokenAmount,
    address targetToken
  ) external returns (uint256) {
    VVSRouter02 vvsRouter = VVSRouter02(VVSContractRouterAddr);
    if (IERC20(originToken).allowance(address(this), address(vvsRouter)) < originTokenAmount) {
      IERC20(originToken).safeApprove(address(vvsRouter), type(uint256).max);
    }

    address[] memory path = new address[](2);
    path[0] = originToken;
    path[1] = targetToken;

    uint256[] memory amounts = vvsRouter.swapExactTokensForTokens(
      originTokenAmount,
      0,
      path,
      address(this),
      block.timestamp + 5 minutes
    );

    return amounts[amounts.length - 1];
  }
}
