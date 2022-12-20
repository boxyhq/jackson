/**
 * @title Login Component with default styles
 * @description Login Component with a non failing forwardTenant
 * @order 1
 */

import { Login } from '@boxyhq/react-ui';

const Demo1 = () => {
  return (
    <Login
      onSubmit={async () => {
        // return nothing
      }}
      inputLabel='Tenant'
    />
  );
};

export default Demo1;
