import React, { MouseEvent } from 'react';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import { Provider } from '../utils/provider';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import ETH_ICON from '../imgs/eth.png';
import CRONOS_ICON from '../imgs/cronos.png';

const ChainNameMap = {
  1: 'Ethereum',
  25: 'Cronos Mainnet',
  338: 'Cronos Testnet',
  31337: 'Cronos'
};

const ChainIconMap = {
  [ChainNameMap[1]]: ETH_ICON,
  [ChainNameMap[25]]: CRONOS_ICON,
  [ChainNameMap[338]]: CRONOS_ICON,
  [ChainNameMap[31337]]: CRONOS_ICON
};

export function ChainButton() {
  const { chainId } = useWeb3React<Provider>();

  return !!chainId && (ChainNameMap as any)[chainId] ? (
    <Button
      variant="outlined"
      style={{ textTransform: 'none', borderRadius: '6px', padding: '4px 8px', marginLeft: '8px' }}
    >
      <Avatar
        alt="METAMASK_ICON"
        src={ChainIconMap[(ChainNameMap as any)[chainId]]}
        sx={{ width: 20, height: 20, marginRight: 1 }}
      />
      {(ChainNameMap as any)[chainId]}
    </Button>
  ) : null;
}
