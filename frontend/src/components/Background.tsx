import React from 'react';
import c from 'classnames';
import { isMobile } from 'react-device-detect';

import s from './Background.module.scss';

function Background({ children }: { children: React.ReactNode }) {
  if (isMobile) {
    return (
      <div className={c(s.wrapper, s.mobile)}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%'
          }}
        >
          This content is available only on PC
        </div>
      </div>
    );
  }
  return <div className={s.wrapper}>{children}</div>;
}

export default Background;
