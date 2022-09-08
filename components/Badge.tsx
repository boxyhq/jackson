import React from 'react';

interface Props {
  vairant?: 'info' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
}

const Badge = (props: Props) => {
  const { vairant = 'info', children } = props;

  return <div className={`badge gap-2 badge-${vairant}`}>{children}</div>;
};

export default Badge;
