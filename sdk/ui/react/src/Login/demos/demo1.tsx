/**
 * @title Login Component with default styles
 * @description Login Component with a non failing forwardTenant
 * @order 1
 */

import { Login } from '@boxyhq/react-ui';

const Demo1 = () => {
  return (
    <Login
      forwardTenant={async () => {
        // return nothing
      }}
      label='Tenant'
    />
  );
};

export default Demo1;
