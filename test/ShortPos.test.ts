import { ethers } from 'hardhat';
import { BigNumber } from 'ethers';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import VVSRouterABI from '../ABIs/vvsRouter.json';
import WCROABI from '../ABIs/wcro.json';
import ERC20ABI from '../ABIs/erc20.json';
import TERC20ABI from '../ABIs/tErc20.json';

export const VVSRouterAddress = '0x145863Eb42Cf62847A6Ca784e6416C1682b1b2Ae';
export const TectonicSocketAddress = '0xb3831584acb95ED9cCb0C11f677B5AD01DeaeEc0';
export const OracleAddress = '0xD360D8cABc1b2e56eCf348BFF00D2Bd9F658754A';
export const WCROAddress = '0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23';

export const TokensMap = {
  TUSD: {
    address: '0x87EFB3ec1576Dec8ED47e58B832bEdCd86eE186e',
    decimals: 6,
    tTokenAddress: '0x4bD41f188f6A05F02b46BB2a1f8ba776e528F9D2'
  },
  USDC: {
    address: '0xc21223249CA28397B4B6541dfFaEcC539BfF0c59',
    decimals: 6,
    tTokenAddress: '0xB3bbf1bE947b245Aef26e3B6a9D777d7703F4c8e'
  },
  WETH: {
    address: '0xe44Fd7fCb2b1581822D0c862B68222998a0c299a',
    decimals: 18,
    tTokenAddress: '0x543F4Db9BD26C9Eb6aD4DD1C33522c966C625774'
  }
};

describe('Short Position', function () {
  async function setupContracts() {
    const [owner, accountA, accountB, accountC, accountD] = await ethers.getSigners();

    const SwapCenter = await ethers.getContractFactory('SwapCenter');
    const swapCenter = await SwapCenter.deploy();

    const ShortCoin = await ethers.getContractFactory('Short');
    const ShortPos = await ethers.getContractFactory('ShortPos', {
      libraries: {
        SwapCenter: swapCenter.address
      }
    });

    const shortCoin = await ShortCoin.deploy();
    const shortPos = await ShortPos.deploy(shortCoin.address, TectonicSocketAddress, VVSRouterAddress, OracleAddress);

    const tokenInfoAddrs = Object.values(TokensMap).map((tokenInfo) => {
      return [tokenInfo.address, tokenInfo.tTokenAddress];
    });

    const tx = await shortPos._initialize(tokenInfoAddrs);
    await tx.wait();

    // transfer token owner to dapp contract
    const shortCoinTx = await shortCoin.transferOwnership(shortPos.address);
    await shortCoinTx.wait();

    return { shortPos, shortCoin, swapCenter, owner, accountA, accountB, accountC, accountD };
  }

  async function setupBalance() {
    const contractsDeployed = await setupContracts();
    const { shortPos, accountA } = contractsDeployed;

    const wCRO = new ethers.Contract(WCROAddress, WCROABI, accountA);
    const vvsRouter = new ethers.Contract(VVSRouterAddress, VVSRouterABI, accountA);

    const latestBlock = await ethers.provider.getBlock(await ethers.provider.getBlockNumber());

    // swap for USDC
    const vvsRouterTx = await vvsRouter
      .connect(accountA)
      .swapExactETHForTokens(
        0,
        [wCRO.address, TokensMap.USDC.address],
        accountA.address,
        latestBlock.timestamp + 1000000,
        {
          value: ethers.utils.parseEther('5000') // ~= 730.306 USDC
        }
      );

    await vvsRouterTx.wait();

    // approve to use USDC as collateral
    const USDCContract = new ethers.Contract(TokensMap.USDC.address, ERC20ABI, accountA);
    const USDCContractTx = await USDCContract.connect(accountA).approve(shortPos.address, ethers.constants.MaxUint256);
    await USDCContractTx.wait();

    return {
      ...contractsDeployed,
      USDCContract
    };
  }

  async function getTokenBalance(
    address: string,
    _account?: SignerWithAddress,
    _tokenAddress = TokensMap.WETH.address
  ) {
    const [, accountA] = await ethers.getSigners();

    const account = _account || accountA;

    const TokenContract = new ethers.Contract(_tokenAddress, ERC20ABI, account);
    return await TokenContract.balanceOf(address);
  }

  async function getTTokenBalance(
    address: string,
    _account?: SignerWithAddress,
    _tTokenAddress = TokensMap.USDC.tTokenAddress
  ) {
    const [, accountA] = await ethers.getSigners();

    const account = _account || accountA;

    const tTokenContract = new ethers.Contract(_tTokenAddress, TERC20ABI, account);
    return await tTokenContract.balanceOf(address);
  }

  describe('Deployment', () => {
    it('Should transfer the ownership to ShortPos contract', async () => {
      const { shortPos, shortCoin, owner } = await setupContracts();

      expect(await shortPos.owner()).to.equal(owner.address);
      expect(await shortCoin.owner()).to.equal(shortPos.address);
    });
    it('Should setup the markets correctly', async () => {
      const { shortPos } = await setupContracts();

      Object.values(TokensMap).forEach(async (tokenInfo) => {
        const { address, tTokenAddress } = tokenInfo;
        expect(await shortPos.marketsMapping(address)).to.equal(tTokenAddress);
      });
    });
  });

  describe('Create Short Position', () => {
    it('Should get user USDC as collateral by VVS Swap', async () => {
      const { accountA, USDCContract } = await setupBalance();
      const userUSDCBalance = await USDCContract.balanceOf(accountA.address);
      await expect(userUSDCBalance.gt(BigNumber.from(0))).to.be.true;
    });
    it('Should create a short position and returned the certificate to user', async () => {
      const { accountA, shortPos, shortCoin, USDCContract } = await setupBalance();
      const createShortPosTx = await shortPos
        .connect(accountA)
        .createShortPos(TokensMap.WETH.address, ethers.utils.parseEther('0.01'), TokensMap.USDC.address);
      await createShortPosTx.wait();
      console.log('----------- after createShortPos');
      console.log('-----------\n');
      const WETHBalance = await getTokenBalance(shortPos.address);
      console.log('WETH Balance (ShortPos contract): ', WETHBalance);
      // Should be 0 WETH in ShortPos contract
      expect(WETHBalance).to.equal(BigNumber.from(0));
      const tUSDCBalance = await getTTokenBalance(shortPos.address);
      const USDCBalance = await USDCContract.balanceOf(shortPos.address);
      console.log('tUSDC Balance (ShortPos contract)', tUSDCBalance); // ~= 331.65962057 tUSDC,
      // Exchange rate: 1 USDC = 9.896716005166509 tUSDC
      // 331 / 9.8 / 2 ~= 16.8
      console.log('USDC Balance (ShortPos contract)', USDCBalance); // ~= 16.797920 USDC = 0.01 WETH
      await expect(tUSDCBalance.gt(BigNumber.from(0))).to.be.true;
      await expect(USDCBalance.gt(BigNumber.from(0))).to.be.true;
      console.log('accountA ShortToken balance', await shortCoin.balanceOf(accountA.address)); // 16.797920 SHORT token (1:1 USDC)
      await expect((await shortCoin.balanceOf(accountA.address)).gt(BigNumber.from(0))).to.be.true;
      // get order info
      const orderInfo = await shortPos.OrdersIdMapping(accountA.address, 1);
      console.log('order info: ', orderInfo);

      console.log('orderInfo.collateralAmount', ethers.utils.formatUnits(orderInfo.collateralAmount, 6));

      expect(orderInfo.shortToken).to.equal(TokensMap.WETH.address);
      expect(orderInfo.shortTokenAmount).to.equal(ethers.utils.parseEther('0.01'));
      expect(orderInfo.collateralToken).to.equal(TokensMap.USDC.address);
      expect(orderInfo.tCollateralAmount).to.equal(tUSDCBalance);
      expect(orderInfo.certificateTokenAmount).to.equal(await shortCoin.balanceOf(accountA.address));
    });

    it('Should redeem a short position', async () => {
      const { accountA, shortPos, shortCoin, USDCContract } = await setupBalance();

      const createShortPosTx = await shortPos
        .connect(accountA)
        .createShortPos(TokensMap.WETH.address, ethers.utils.parseEther('0.01'), TokensMap.USDC.address);
      await createShortPosTx.wait();

      const approveTx = await shortCoin.connect(accountA).approve(shortPos.address, ethers.constants.MaxUint256);
      await approveTx.wait();

      const redeemTx = await shortPos.connect(accountA).redeem(0);
      await redeemTx.wait();

      console.log('-----------after Redeem');
      console.log('Monitor: accountA USDC balance', await USDCContract.balanceOf(accountA.address));

      const WETHContract = new ethers.Contract(TokensMap.WETH.address, ERC20ABI, accountA);
      const wethInDapp = await WETHContract.balanceOf(shortPos.address);
      console.log('Dapp WETH', wethInDapp);
      const tUSDCContract = new ethers.Contract(TokensMap.USDC.tTokenAddress, TERC20ABI, accountA);
      const tTokenInShortPos = await tUSDCContract.balanceOf(shortPos.address);
      const usdcInShortPos = await USDCContract.balanceOf(shortPos.address);
      console.log('ShortPos tUSDC', tTokenInShortPos);
      console.log('ShortPos USDC', usdcInShortPos);
      console.log('ShortCoin balance: ', await shortCoin.balanceOf(accountA.address));

      await expect((await shortCoin.balanceOf(accountA.address)).eq(BigNumber.from(0))).to.be.true;
    });
  });
});
