import ETH_ICON from './imgs/eth.png';
import CRO_ICON from './imgs/cro.png';
import WBTC_ICON from './imgs/btc.png';
import USDC_ICON from './imgs/usdc.png';
import USDT_ICON from './imgs/usdt.png';
import TECTONIC_ICON from './imgs/tectonic.png';
import VVS_ICON from './imgs/vvs.png';

export const ShortTokenAddress = '0xd6908abf5E8304C6a732b5aE0A7874201B50fff9';
export const ShortPosAddress = '0xf22450F18342b2e331E27E680857309A39A79527';

export const VVSRouterAddress = '0x145863Eb42Cf62847A6Ca784e6416C1682b1b2Ae';
export const TectonicSocketAddress = '0xb3831584acb95ED9cCb0C11f677B5AD01DeaeEc0';
export const OracleAddress = '0xD360D8cABc1b2e56eCf348BFF00D2Bd9F658754A';
export const TonicUSDOracleAddress = '0x14f753940720c1fa4247cd464c7ea28c806d123f';
export const BandOracle = '0xDA7a001b254CD22e46d3eAB04d937489c93174C3';

export const WCROAddress = '0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23';

export const TokensMap = {
  TUSD: {
    shortName: 'TUSD',
    address: '0x87EFB3ec1576Dec8ED47e58B832bEdCd86eE186e',
    decimals: 6,
    tTokenAddress: '0x4bD41f188f6A05F02b46BB2a1f8ba776e528F9D2',
    icon: USDT_ICON
  },
  USDC: {
    shortName: 'USDC',
    address: '0xc21223249CA28397B4B6541dfFaEcC539BfF0c59',
    decimals: 6,
    tTokenAddress: '0xB3bbf1bE947b245Aef26e3B6a9D777d7703F4c8e',
    icon: USDC_ICON
  },
  ETH: {
    shortName: 'ETH',
    address: '0xe44Fd7fCb2b1581822D0c862B68222998a0c299a',
    decimals: 18,
    tTokenAddress: '0x543F4Db9BD26C9Eb6aD4DD1C33522c966C625774',
    icon: ETH_ICON
  },
  WBTC: {
    shortName: 'WBTC',
    address: '0x062E66477Faf219F25D27dCED647BF57C3107d52',
    decimals: 8,
    tTokenAddress: '0x67fD498E94d95972a4A2a44AccE00a000AF7Fe00',
    icon: WBTC_ICON
  },
  CRO: {
    shortName: 'CRO',
    address: '0x5c7f8a570d578ed84e63fdfa7b1ee72deae1ae23',
    decimals: 8,
    tTokenAddress: '0xeadf7c01da7e93fdb5f16b0aa9ee85f978e89e95',
    icon: CRO_ICON
  }
};
