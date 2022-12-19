/**
 * @title Login Component unstyled
 * @description Login Component unstyled
 * @order 3
 */

import { Login } from '@boxyhq/react-ui';

const Demo3 = () => {
  return (
    <Login
      forwardTenant={async () => {
        //return nothing
      }}
      label='Tenant'
      unstyled
    />
  );
};

export default Demo3;
