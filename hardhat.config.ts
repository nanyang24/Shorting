import * as dotenv from 'dotenv';

import { HardhatUserConfig } from 'hardhat/config';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import 'hardhat-abi-exporter';

import './tasks/deploy';

dotenv.config();

const config: HardhatUserConfig = {
  solidity: '0.8.4',
  paths: {
    artifacts: './frontend/src/artifacts'
  },
  networks: {
    hardhat: {
      // mining: {
      //   auto: false,
      //   interval: 1000
      // }
      forking: {
        // eslint-disable-next-line
        enabled: true,
        url: 'https://evm.cronos.org'
        // url: 'https://mainnet-archive.cronoslabs.com/v1/55e37d8975113ae7a44603ef8ce460aa'
        // url: 'https://mainnet.cronoslabs.com/v1/89433fdc930781343d3465d593a76dfd'
      }
    },
    ropsten: {
      url: process.env.ROPSTEN_URL || '',
      accounts: process.env.TEST_ETH_ACCOUNT_PRIVATE_KEY !== undefined ? [process.env.TEST_ETH_ACCOUNT_PRIVATE_KEY] : []
    },
    'cronos-mainnet': {
      // url: 'https://mainnet-archive.cronoslabs.com/v1/55e37d8975113ae7a44603ef8ce460aa',
      url: 'https://evm.cronos.org',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD'
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
    customChains: [
      {
        network: 'Cronos',
        chainId: 25,
        urls: {
          apiURL: 'https://api.cronoscan.com/api',
          browserURL: 'https://cronoscan.com'
        }
      }
    ]
  },
  mocha: {
    timeout: 100000000
  }
};

export default config;
