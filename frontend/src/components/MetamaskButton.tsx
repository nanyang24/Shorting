import React, { MouseEvent } from 'react';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import { ReactElement, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Provider } from '../utils/provider';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import { injected } from '../utils/connectors';
import { AbstractConnector } from '@web3-react/abstract-connector';
import METAMASK_ICON from '../imgs/metamask.png';

import s from './Metamask.module.scss';

type ActivateFunction = (
  connector: AbstractConnector,
  onError?: (error: Error) => void,
  throwErrors?: boolean
) => Promise<void>;

export function MetamaskButton() {
  const context = useWeb3React<Provider>();
  const { activate, active } = context;
  const { account, library, chainId } = useWeb3React<Provider>();

  function handleActivate(event: MouseEvent<HTMLButtonElement>): void {
    event.preventDefault();

    async function _activate(activate: ActivateFunction): Promise<void> {
      await activate(injected);
    }

    _activate(activate);
  }

  return active ? (
    <Button variant="contained" style={{ borderRadius: '6px', padding: '4px 8px' }}>
      <Avatar alt="METAMASK_ICON" src={METAMASK_ICON} sx={{ width: 20, height: 20, marginRight: 1 }} />
      {typeof account === 'undefined'
        ? ''
        : account
        ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}`
        : ''}
    </Button>
  ) : (
    <Button variant="contained" onClick={handleActivate} style={{ borderRadius: '6px', padding: '4px 8px' }}>
      Connect
    </Button>
  );
}
