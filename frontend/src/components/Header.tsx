import React from 'react';
import { Provider } from '../utils/provider';
import { useWeb3React } from '@web3-react/core';
import Avatar from '@mui/material/Avatar';
import Alert from '@mui/material/Alert';
import { MetamaskButton } from './MetamaskButton';
import { ChainButton } from './ChainButton';
import CronosLabsIcon from '../imgs/cronos_labs.png';

import s from './Header.module.scss';

function Header() {
  const { account, library, chainId } = useWeb3React<Provider>();

  return (
    <div className={s.wrapper}>
      <Avatar
        alt="CronosLabsIcon"
        variant="square"
        src={CronosLabsIcon}
        sx={{ width: 116, height: 35, marginRight: 1 }}
      />
      <div>
        <MetamaskButton />
        <ChainButton />
      </div>
      {!!chainId && chainId !== 25 && (
        <Alert severity="warning" className={s.alert}>
          Shorting Demo is not supported on this network. Please switch to Cronos Mainnet.
        </Alert>
      )}
    </div>
  );
}

export default Header;
