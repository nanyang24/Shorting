import React from 'react';

import s from './Background.module.scss';

function Background({ children }: {
  children: React.ReactNode;
}) {
  return <div className={s.wrapper}>{children}</div>;
}

export default Background;
