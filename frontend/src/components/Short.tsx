import React, { ChangeEvent, ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import c from 'classnames';
import { Provider } from '../utils/provider';
import { useWeb3React } from '@web3-react/core';
import { BigNumber, Contract, ethers, Signer } from 'ethers';

import { createTheme, ThemeProvider } from '@mui/material/styles';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import InputAdornment from '@mui/material/InputAdornment';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';

import { BandOracle, ShortPosAddress, TectonicSocketAddress, TokensMap, TonicUSDOracleAddress } from '../config';
import BandOracleABI from '../ABIs/BandOracle.json';
import TecTonicCoreABI from '../ABIs/TecTonicCore.json';
import TonicUSDOracleABI from '../ABIs/TonicUSDOracle.json';
import ShortPosArtifact from '../artifacts/contracts/ShortPos.sol/ShortPos.json';
import TERC20ABI from '../ABIs/tErc20.json';
import ERC20ABI from '../ABIs/erc20.json';

import WBTC_ICON from '../imgs/btc.png';
import CRO_ICON from '../imgs/cro.png';
import ETH_ICON from '../imgs/eth.png';
import TECTONIC_ICON from '../imgs/tectonic.png';
import TONIC_ICON from '../imgs/TONIC_logo.png';
import USDC_ICON from '../imgs/usdc.png';
import USDT_ICON from '../imgs/usdt.png';
import VVS_ICON from '../imgs/vvs.png';

import s from './Short.module.scss';

interface TabPanelProps {
  children?: React.ReactNode;
  className?: string;
  index: number;
  value: number;
}

interface Position {
  id: BigNumber;
  shortToken: string;
  shortTokenAmount: BigNumber;
  collateralToken: string;
  collateralAmount: BigNumber;
  tCollateralAmount: BigNumber;
  certificateTokenAmount: BigNumber;
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`
  };
}

const getPercentage = (v: number, show?: boolean) => {
  if (v) return `${v.toFixed(2)} %`;
  return show ? '0 %' : undefined;
};

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && children}
    </div>
  );
}

function InfoItem({
  title,
  value,
  valueClassName,
  icon,
  tip
}: {
  title: string;
  value?: string;
  valueClassName?: string;
  icon?: string;
  tip?: string;
}) {
  return (
    <div className={s.infoItem}>
      <div className={s.infoTitle}>
        {icon && <Avatar className={s.icon} src={icon} sx={{ width: 16, height: 16, marginRight: 1 }} />}
        {title}
        {tip && (
          <Tooltip title={tip}>
            <HelpOutlineOutlinedIcon />
          </Tooltip>
        )}
      </div>
      <div className={c(s.infoValue, valueClassName)}>
        {!!value ? value : <Skeleton variant="text" width={100} height={25} />}
      </div>
    </div>
  );
}

export function Short(): ReactElement {
  const { library } = useWeb3React<Provider>();

  const [mode] = React.useState<'light' | 'dark'>('dark');
  const [signer, setSigner] = useState<Signer>();
  const [shortToken, setShortToken] = useState<keyof typeof TokensMap>('ETH');
  const [shortTokenAmount, setShortTokenAmount] = useState(0);
  const [collateralToken, setCollateralToken] = useState<keyof typeof TokensMap>('USDC');
  const [collateralTokenAmount, setCollateralTokenAmount] = useState(0);
  const [bandOracleContract, setBandOracleContract] = useState<Contract>();
  const [shortPosContract, setShortPosContract] = useState<Contract>();
  const [tectonicContract, setTectonicContract] = useState<Contract>();
  const [tonicUSDOracle, setTonicUSDOracle] = useState<Contract>();
  const [borrowAPY, setBorrowAPY] = useState(0);
  const [distributeAPYBorrowSide, setDistributeAPYBorrowSide] = useState(0);
  const [positionList, setPositionList] = useState<Position[]>([]);
  const [shortTokenPrice, setShortTokenPrice] = useState('0');
  const [isShorting, setIsShorting] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isGettingPosition, setGettingPosition] = useState(false);
  const [tabIndex, setTabIndex] = React.useState(0);

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode
        }
      }),
    [mode]
  );

  useEffect((): void => {
    if (!library) {
      setSigner(undefined);
      return;
    }

    setSigner(library.getSigner());
  }, [library]);

  useEffect(() => {
    if (signer && !shortPosContract) {
      const s = new ethers.Contract(ShortPosAddress, ShortPosArtifact.abi, signer);
      setShortPosContract(s);
    }
    if (signer && !tectonicContract) {
      const c = new ethers.Contract(TectonicSocketAddress, TecTonicCoreABI, signer);
      setTectonicContract(c);
    }
    if (signer && !tonicUSDOracle) {
      const c = new ethers.Contract(TonicUSDOracleAddress, TonicUSDOracleABI, signer);
      setTonicUSDOracle(c);
    }
  }, [shortPosContract, tectonicContract, tonicUSDOracle, signer]);

  // const deploy = async () => {
  //   if (!signer) return;

  //   const ShortToken = new ethers.ContractFactory(ShortTokenArtifact.abi, ShortTokenArtifact.bytecode, signer);
  //   const shortToken = await ShortToken.deploy();
  //   await shortToken.deployed();

  //   const SwapCenter = new ethers.ContractFactory(SwapCenterArtifact.abi, SwapCenterArtifact.bytecode, signer);
  //   const swapCenter = await SwapCenter.deploy();
  //   await swapCenter.deployed();

  //   const bytecode = linkLibraries(
  //     {
  //       bytecode: ShortPosArtifact.bytecode,
  //       linkReferences: ShortPosArtifact.linkReferences
  //     },
  //     {
  //       SwapCenter: swapCenter.address
  //     }
  //   );

  //   const ShortPos = new ethers.ContractFactory(ShortPosArtifact.abi, bytecode, signer);

  //   const shortPos = await ShortPos.deploy(shortToken.address, TectonicSocketAddress, VVSRouterAddress, OracleAddress);
  //   await shortPos.deployed();

  //   setShortPosContract(shortPos);

  //   const tokenInfoAddrs = Object.values(TokensMap).map((tokenInfo) => {
  //     return [tokenInfo.address, tokenInfo.tTokenAddress];
  //   });

  //   const tx = await shortPos._initialize(tokenInfoAddrs);
  //   await tx.wait();

  //   const shortTokenTx = await shortToken.transferOwnership(shortPos.address);
  //   await shortTokenTx.wait();
  // };

  // const initialize = async () => {
  // if (!signer || !library || !shortPosContract) return;

  // const wCRO = new ethers.Contract(WCROAddress, WCROABI, signer);
  // const vvsRouter = new ethers.Contract(VVSRouterAddress, VVSRouterABI, signer);
  // const latestBlock = await library.getBlock(await library.getBlockNumber());

  // // swap for USDC
  // const vvsRouterTx = await vvsRouter
  //   .connect(signer)
  //   .swapExactETHForTokens(
  //     0,
  //     [wCRO.address, TokensMap.USDC.address],
  //     signer.getAddress(),
  //     latestBlock.timestamp + 1000000,
  //     {
  //       value: ethers.utils.parseEther('1000') // ~= 730.306 USDC
  //     }
  //   );

  // await vvsRouterTx.wait();

  //   const USDCContract = new ethers.Contract(TokensMap.USDC.address, ERC20ABI, signer);

  //   const USDCContractTx = await USDCContract.connect(signer).approve(
  //     shortPosContract.address,
  //     ethers.constants.MaxUint256
  //   );
  //   await USDCContractTx.wait();
  // };

  const handleSelect = (event: SelectChangeEvent) => {
    setShortToken(event.target.value as any);
  };

  const handleCollateralTokenSelect = (event: SelectChangeEvent) => {
    setCollateralToken(event.target.value as any);
  };

  const handleShortAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    setShortTokenAmount(e.target.valueAsNumber);
  };
  const handleCollateralAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCollateralTokenAmount(e.target.valueAsNumber);
  };

  useEffect(() => {
    if (!shortTokenAmount || !shortTokenPrice) {
      return setCollateralTokenAmount(0);
    }
    // 2 times
    const presetCollateralTokenAmount = 2 * shortTokenAmount * +shortTokenPrice;
    setCollateralTokenAmount(presetCollateralTokenAmount);
  }, [shortTokenAmount, shortTokenPrice]);

  const handleShort = async () => {
    if (!shortPosContract || !signer || !shortToken) return;

    setIsShorting(true);

    const shortTokenInfo = Object.values(TokensMap).find((t) => {
      if (t.shortName === shortToken) return t;
      return false;
    });
    const collateralTokenInfo = Object.values(TokensMap).find((t) => {
      if (t.shortName === collateralToken) return t;
      return false;
    });

    if (shortTokenInfo && collateralTokenInfo) {
      try {
        const USDCContract = new ethers.Contract(TokensMap.USDC.address, ERC20ABI, signer);

        const USDCContractTx = await USDCContract.connect(signer).approve(
          shortPosContract.address,
          ethers.constants.MaxUint256
        );
        await USDCContractTx.wait();

        const createShortPosTx = await shortPosContract
          .connect(signer)
          .createShortPos(
            shortTokenInfo.address,
            ethers.utils.parseEther(shortTokenAmount.toString()),
            collateralTokenInfo.address
          );
        await createShortPosTx.wait();
        console.log('short created');
        setIsShorting(false);
        setTabIndex(1);
      } catch (error) {
        console.error('short error', error);
        setIsShorting(false);
      }
    }
  };

  const handleRedeem = async (orderId: number) => {
    if (!shortPosContract || !signer || !shortToken) return;

    console.log('redeeming...');
    setIsRedeeming(true);

    try {
      const createShortPosTx = await shortPosContract.connect(signer).redeem(orderId);
      await createShortPosTx.wait();

      console.log('redeemed');
    } catch (error) {
    } finally {
      setIsRedeeming(false);
    }
  };

  const getPriceFeed = async (tokenName: string) => {
    if (!signer || !tokenName) return;

    if (tokenName === TokensMap.TUSD.shortName || tokenName === TokensMap.USDC.shortName) return BigNumber.from(1);

    if (!bandOracleContract) {
      const BandOracleContract = new ethers.Contract(BandOracle, BandOracleABI, signer);
      setBandOracleContract(BandOracleContract);
      const tokenPriceBN: BigNumber[] = await BandOracleContract.connect(signer).getReferenceData(tokenName, 'USD');

      return tokenPriceBN[0];
    } else {
      const tokenPriceBN: BigNumber[] = await bandOracleContract.connect(signer).getReferenceData(tokenName, 'USD');

      return tokenPriceBN[0];
    }
  };

  const updatePrice = async () => {
    if (!signer || !shortToken) return;

    setShortTokenPrice('0');
    const tokenPriceBN = await getPriceFeed(shortToken);
    const shortTokenInfo = Object.values(TokensMap).find((t) => {
      if (t.shortName === shortToken) return t;
      return false;
    });

    if (tokenPriceBN) {
      const tokenPrice = ethers.utils.formatUnits(tokenPriceBN, 18);
      setShortTokenPrice(tokenPrice);
    }
  };

  const updateBorrowAPY = async () => {
    const tTokenAddress = TokensMap[shortToken].tTokenAddress;
    if (!tTokenAddress) return;

    setBorrowAPY(0);

    const tTokenContract = new ethers.Contract(tTokenAddress, TERC20ABI, signer);

    const borrowRate = await tTokenContract.borrowRatePerBlock();

    const dailyYieldRate =
      borrowRate.mul(BigNumber.from(14400)).mul(10000000).div(BigNumber.from('1000000000000000000')).toNumber() /
        10000000 +
      1;

    const annualYieldRate = (Math.pow(dailyYieldRate, 365) - 1) * 10000;

    const borrowAPY = Math.round(annualYieldRate) / 100;

    setBorrowAPY(borrowAPY);
  };

  const updateDistributeAPY = async () => {
    const tTokenAddress = TokensMap[shortToken].tTokenAddress;
    if (!tTokenAddress || !tectonicContract || !tonicUSDOracle) return;

    const getDistributeAPY = async () => {
      setDistributeAPYBorrowSide(0);

      const tonicSpeedPerBlock = await tectonicContract.tonicSpeeds(tTokenAddress);
      const tonicDailyDistributeRateForBorrow = tonicSpeedPerBlock.mul(BigNumber.from(14400));
      const tonicUSDPrice = await tonicUSDOracle.latestAnswer();
      const tonicDecimals = await tonicUSDOracle.decimals();

      const annualTonicDistributionUsdValue = tonicUSDPrice
        .mul(tonicDailyDistributeRateForBorrow)
        .div(BigNumber.from(10).pow(tonicDecimals))
        .mul(365);

      const tTokenContract = new ethers.Contract(tTokenAddress, TERC20ABI, signer);
      const totalBorrowAmount = await tTokenContract.totalBorrows();

      const shortTokenPrice = await getPriceFeed(shortToken);

      const ShortToken = Object.values(TokensMap).find((t) => {
        if (t.shortName === shortToken) return t;
        return false;
      });

      if (shortTokenPrice) {
        const underlyingUsdValue = shortTokenPrice
          .mul(totalBorrowAmount)
          .div(BigNumber.from(10).pow(ShortToken?.decimals!));

        // const normalizedUsdPrice = underlyingUsdValue
        //   .mul(BigNumber.from(10).pow(18))
        //   .mul(BigNumber.from(10).pow(18))
        //   .div(BigNumber.from(10).pow(36));

        const tonicBorrowApyRate = parseFloat(
          ethers.utils.formatUnits(
            annualTonicDistributionUsdValue.mul(BigNumber.from(10).pow(18)).div(underlyingUsdValue),
            18
          )
        );

        setDistributeAPYBorrowSide(tonicBorrowApyRate);
      }
    };

    try {
      getDistributeAPY();
    } catch (error) {
      getDistributeAPY();
    }
  };

  useEffect(() => {
    updatePrice();
    updateBorrowAPY();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortToken, signer]);

  useEffect(() => {
    updateDistributeAPY();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortToken, signer, tonicUSDOracle, tectonicContract]);

  const curLtv = useMemo(() => {
    if (shortTokenPrice && shortTokenAmount && collateralTokenAmount) {
      return (+shortTokenPrice * shortTokenAmount) / collateralTokenAmount;
    }
    return 0;
  }, [collateralTokenAmount, shortTokenAmount, shortTokenPrice]);

  const getPricePair = () => {
    // 1,881.5474 USDT/ETH
    if (+shortTokenPrice) return `${shortTokenPrice} ${collateralToken}/${shortToken}`;
    return undefined;
  };

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const getPosition = useCallback(async () => {
    if (!shortPosContract || !signer) return;

    if (tabIndex === 1) {
      setGettingPosition(true);

      try {
        const orders = await shortPosContract.getAllOrdersByUser(signer.getAddress());

        setPositionList(orders);
        setGettingPosition(false);
      } catch (error) {
        setGettingPosition(false);
      }
    }
  }, [shortPosContract, signer, tabIndex]);

  useEffect(() => {
    if (tabIndex === 1) {
      getPosition();
    }
  }, [getPosition, tabIndex]);

  function PositionListItem({ orderInfo, index }: { orderInfo: any; index: number }) {
    const {
      id,
      shortToken,
      shortTokenAmount,
      collateralToken,
      collateralAmount
      // tCollateralAmount,
      // certificateTokenAmount
    } = orderInfo;

    const [ltvPer, setLtvPer] = useState(0);
    const [changePer, setChangePer] = useState(0);
    const [tokenPrice, setTokenPrice] = useState(0);

    const ShortToken = Object.values(TokensMap).find((t) => {
      if (t.address === shortToken) return t;
      return false;
    });
    const CollateralToken = Object.values(TokensMap).find((t) => {
      if (t.address === collateralToken) return t;
      return false;
    });

    const getChangePercentage = async () => {
      const shortTokenPrice = await getPriceFeed(ShortToken?.shortName!);
      const collateralTokenPrice = await getPriceFeed(CollateralToken?.shortName!);

      if (shortTokenPrice && collateralTokenPrice) {
        const change = shortTokenPrice.mul(shortTokenAmount).div(collateralTokenPrice.mul(collateralAmount.div(2)));

        const changeFormat = ethers.utils.formatUnits(change, 18 + 6 + 6).substring(0, 6);
        const percentage = ((1 - Number(changeFormat)) * 100).toFixed(3);

        setChangePer(+percentage);
      } else {
        setChangePer(0);
      }
    };

    const getLtv = async () => {
      const shortTokenPrice = await getPriceFeed(ShortToken?.shortName!);
      const collateralTokenPrice = await getPriceFeed(CollateralToken?.shortName!);

      if (shortTokenPrice && collateralTokenPrice) {
        const ltv = shortTokenPrice.mul(shortTokenAmount).div(collateralAmount);

        const ltvFormat = ethers.utils.formatUnits(ltv, 18 + 6 + 6).substring(0, 6);

        const percentage = (+ltvFormat).toFixed(3);

        setLtvPer(+percentage * 100);
      } else {
        setLtvPer(0);
      }
    };

    const getTokenPrice = async () => {
      const shortTokenPrice = await getPriceFeed(ShortToken?.shortName!);

      if (shortTokenPrice) {
        const price = ethers.utils.formatUnits(shortTokenPrice.mul(shortTokenAmount), 36);
        setTokenPrice(+price);
      } else {
        setTokenPrice(0);
      }
    };

    useEffect(() => {
      getChangePercentage();
      getLtv();
      getTokenPrice();
    }, []);

    return (
      <Box className={s.tableItem}>
        <Typography variant="body1" gutterBottom component="div">
          <div className={s.asset}>
            <Avatar className={s.icon} src={ShortToken?.icon} sx={{ width: 36, height: 36, marginRight: 1 }} />
            <div>
              <div className={s.name}>{ShortToken?.shortName}</div>
              <div className={s.address}>
                {shortToken.substring(0, 4)}...{shortToken.substring(shortToken.length - 4)}
              </div>
            </div>
          </div>
        </Typography>
        <Typography variant="body1" gutterBottom component="div" className={s.id}>
          #{index + 1}
        </Typography>
        <Typography variant="body1" gutterBottom component="div" className={s.debt}>
          <div className={s.amount}>
            {(+ethers.utils.formatUnits(shortTokenAmount, ShortToken?.decimals)).toFixed(6)}
          </div>
          <div className={s.price}>${tokenPrice.toFixed(6)}</div>
        </Typography>
        <Typography variant="body1" gutterBottom component="div" className={s.collateral}>
          <Tooltip title={CollateralToken?.shortName || ''}>
            <Avatar className={s.icon} src={CollateralToken?.icon} sx={{ width: 24, height: 24, marginRight: 1 }} />
          </Tooltip>
          <div>{ethers.utils.formatUnits(collateralAmount, CollateralToken?.decimals)}</div>
        </Typography>
        <Typography variant="body1" gutterBottom component="div" className={s.ltv}>
          <div>{ltvPer.toFixed(2)}%</div>
          <LinearProgress variant="determinate" value={ltvPer} />
        </Typography>
        <Typography variant="body1" gutterBottom component="div" className={s.change}>
          <div className={c(changePer >= 0 ? s.green : s.red)}>{changePer.toFixed(2)}%</div>
        </Typography>
        <Typography variant="body1" gutterBottom component="div" className={s.action}>
          <Button
            variant="contained"
            style={{ textTransform: 'none' }}
            disabled={isRedeeming}
            onClick={() => handleRedeem(id)}
          >
            Redeem
            {isRedeeming && <CircularProgress />}
          </Button>
        </Typography>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Tabs value={tabIndex} onChange={handleChange} aria-label="Tabs" className={s.tabs}>
        <Tab label="Shorting" disableRipple {...a11yProps(0)} />
        <Tab label="My Position" disableRipple {...a11yProps(1)} />
      </Tabs>
      <TabPanel value={tabIndex} index={0}>
        <>
          <div className={s.wrapper}>
            <div className={s.content}>
              <h2 className={s.title}>Short</h2>
              <div className={s.shortOn}>
                <div className={s.text}>Shorting on:</div>
                <div className={s.platform}>
                  <Tooltip title="Tectonic">
                    <Avatar
                      className={s.icon}
                      alt="TECTONIC_ICON"
                      src={TECTONIC_ICON}
                      sx={{ width: 24, height: 24, marginLeft: 1 }}
                    />
                  </Tooltip>
                  <Tooltip title="VVS Finance">
                    <Avatar
                      className={s.icon}
                      alt="VVS_ICON"
                      src={VVS_ICON}
                      sx={{ width: 24, height: 24, marginLeft: 1 }}
                    />
                  </Tooltip>
                </div>
              </div>
              <div className={s.shortText}>Shorting Amount</div>
              <TextField
                id="standard-basic"
                variant="standard"
                type="number"
                value={shortTokenAmount}
                onChange={handleShortAmountChange}
                sx={{
                  height: '50px',
                  '& label.Mui-focused': {
                    color: 'white'
                  },
                  '& .MuiInputBase-root-MuiInput-root': {
                    color: 'white'
                  },
                  '& .MuiInput-input': {
                    height: '30px',
                    paddingLeft: '8px',
                    background: '#282828'
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    display: 'none'
                  },
                  '& .MuiInput-root:hover:not(.Mui-disabled):before': {
                    background:
                      'linear-gradient(141.27deg,#ff904e -4.24%,#ff5982 21.25%,#ec68f4 44.33%,#79e2ff 83.46%)',
                    height: '1px'
                  },
                  '& .MuiInput-underline:after': {
                    borderBottomColor:
                      'linear-gradient(141.27deg,#ff904e -4.24%,#ff5982 21.25%,#ec68f4 44.33%,#79e2ff 83.46%)'
                  },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'white'
                    },
                    '&:hover fieldset': {
                      borderColor: 'white'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'yellow'
                    }
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        value={shortToken}
                        onChange={handleSelect}
                        sx={{
                          width: 120,
                          '& .MuiSelect-select': {
                            display: 'flex'
                          }
                        }}
                      >
                        <MenuItem value={'ETH'}>
                          <Avatar alt="ETH" src={ETH_ICON} sx={{ width: 24, height: 24, marginRight: 1 }} />
                          ETH
                        </MenuItem>
                        <MenuItem value={'CRO'}>
                          <Avatar alt="CRO" src={CRO_ICON} sx={{ width: 24, height: 24, marginRight: 1 }} />
                          CRO
                        </MenuItem>
                        <MenuItem value={'WBTC'}>
                          <Avatar alt="WBTC" src={WBTC_ICON} sx={{ width: 24, height: 24, marginRight: 1 }} />
                          WBTC
                        </MenuItem>
                      </Select>
                    </InputAdornment>
                  )
                }}
              />
              <div className={s.shortText}>Collateral Amount</div>
              <TextField
                id="standard-basic"
                variant="standard"
                type="number"
                value={collateralTokenAmount}
                onChange={handleCollateralAmountChange}
                sx={{
                  height: '50px',
                  '& label.Mui-focused': {
                    color: 'white'
                  },
                  '& .MuiInputBase-root-MuiInput-root': {
                    color: 'white'
                  },
                  '& .MuiInput-input': {
                    height: '30px',
                    paddingLeft: '8px',
                    background: '#282828'
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    display: 'none'
                  },
                  '& .MuiInput-root:hover:not(.Mui-disabled):before': {
                    background:
                      'linear-gradient(141.27deg,#ff904e -4.24%,#ff5982 21.25%,#ec68f4 44.33%,#79e2ff 83.46%)',
                    height: '1px'
                  },
                  '& .MuiInput-underline:after': {
                    borderBottomColor:
                      'linear-gradient(141.27deg,#ff904e -4.24%,#ff5982 21.25%,#ec68f4 44.33%,#79e2ff 83.46%)'
                  },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'white'
                    },
                    '&:hover fieldset': {
                      borderColor: 'white'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'yellow'
                    }
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        value={collateralToken}
                        onChange={handleCollateralTokenSelect}
                        sx={{
                          width: 120,
                          '& .MuiSelect-select': {
                            display: 'flex'
                          }
                        }}
                      >
                        <MenuItem value={'USDC'}>
                          <Avatar alt="USDC" src={USDC_ICON} sx={{ width: 24, height: 24, marginRight: 1 }} />
                          USDC
                        </MenuItem>
                        <MenuItem value={'USDT'}>
                          <Avatar alt="USDT" src={USDT_ICON} sx={{ width: 24, height: 24, marginRight: 1 }} />
                          USDT
                        </MenuItem>
                      </Select>
                    </InputAdornment>
                  )
                }}
              />
            </div>
            <Button
              variant="contained"
              className={s.action}
              disabled={curLtv > 0.5 || curLtv <= 0 || isShorting}
              onClick={handleShort}
            >
              Short {shortToken}
              {isShorting && <CircularProgress />}
            </Button>
          </div>
          <div className={s.blockWrapper}>
            <div className={s.line1}></div>
            <div className={s.line2}></div>
            <div className={s.info}>
              <div className={s.title}>Loan to value</div>
              <div className={s.indicator}>
                <div className={s.tip1} style={{ left: `40%` }}>
                  <div className={s.text}>Recommended</div>
                </div>
                <div className={s.tip2} style={{ left: '50%' }}>
                  <div className={s.text}>Max</div>
                </div>
                <div className={s.tip3} style={{ left: '75%' }}>
                  <div className={s.text}>Liquidation</div>
                </div>
              </div>
              <div className={c(s.progress, curLtv > 1 && s.overflow)}>
                <LinearProgress variant="determinate" value={curLtv * 100} />
              </div>
              <InfoItem
                title="Current LTV"
                value={getPercentage(curLtv * 100, true)}
                valueClassName={c(curLtv > 1 && s.overflow)}
              />
              <InfoItem title="Max LTV" value={getPercentage(50)} />
              <InfoItem title="Liquidation LTV" value={getPercentage(75)} />
              <Divider />
              <InfoItem title="Avg. Price" value={getPricePair()} />
              <Divider />
              <InfoItem
                title="Borrow APY"
                tip="The interest that is paid by borrowers"
                value={getPercentage(borrowAPY)}
              />
              <InfoItem
                title="Distribution APY"
                tip="Tectonic will distribute $TONIC rewards to borrowers and suppliers"
                icon={TONIC_ICON}
                value={getPercentage(distributeAPYBorrowSide * 100)}
              />
            </div>
          </div>
        </>
      </TabPanel>
      <TabPanel value={tabIndex} index={1} className={s.positionPanel}>
        <Box
          className={s.tableHeader}
          // sx={{ p: 2, border: '1px dashed grey' }}
        >
          <Typography variant="h6" gutterBottom component="div">
            ASSETS
          </Typography>
          <Typography variant="h6" gutterBottom component="div">
            ID
          </Typography>
          <Typography variant="h6" gutterBottom component="div">
            DEBT
            <Tooltip title={'Assets borrowed from Tectonic for shorting'}>
              <HelpOutlineOutlinedIcon />
            </Tooltip>
          </Typography>
          <Typography variant="h6" gutterBottom component="div">
            COLLATERAL
          </Typography>
          <Typography variant="h6" gutterBottom component="div">
            LTV
          </Typography>
          <Typography variant="h6" gutterBottom component="div">
            CHANGE
            <Tooltip title={'Token price change ratio since creation'}>
              <HelpOutlineOutlinedIcon />
            </Tooltip>
          </Typography>
        </Box>

        {!!isGettingPosition ? (
          <Box>
            <Skeleton width={'100%'} height={90} />
            <Skeleton width={'100%'} height={90} />
          </Box>
        ) : !!positionList.length ? (
          positionList.map((position, index) => {
            const orderInfo = {
              id: position.id.toNumber(),
              shortToken: position.shortToken,
              shortTokenAmount: position.shortTokenAmount,
              collateralToken: position.collateralToken,
              collateralAmount: position.collateralAmount,
              tCollateralAmount: position.tCollateralAmount,
              certificateTokenAmount: position.certificateTokenAmount
            };

            return <PositionListItem orderInfo={orderInfo} key={index} index={index} />;
          })
        ) : (
          <Typography className={s.emptyHold}>There is no active position.</Typography>
        )}
      </TabPanel>
    </ThemeProvider>
  );
}
