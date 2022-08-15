import React from 'react';
import Avatar from '@mui/material/Avatar';
import AVATAR_ICON from '../imgs/avatar.png';

import s from './Footer.module.scss';

function Footer() {
  return (
    <div className={s.footer}>
      Crafted by{' '}
      <a className={s.name} href="https://nanyang.io" target="_blank" rel="noreferrer">
        <Avatar alt="AVATAR_ICON" src={AVATAR_ICON} sx={{ width: 20, height: 20 }} />
        <span>Aaron Nan</span>
      </a>
    </div>
  );
}

export default Footer;
