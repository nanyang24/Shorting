//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract Short is Ownable, ERC20 {
  constructor() ERC20('Short Token', 'Short') {}

  function decimals() public pure override returns (uint8) {
    return 6; // regarding the stablecoin decimals
  }

  function mint(address account, uint256 amount) public onlyOwner {
    _mint(account, amount);
  }

  function burn(address account, uint256 amount) public onlyOwner {
    _burn(account, amount);
  }
}
