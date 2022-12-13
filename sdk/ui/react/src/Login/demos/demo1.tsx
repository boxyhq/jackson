/**
 * @title Login Component with default styles
 * @description Login Component with a non failing forwardTenant
 * @order 1
 */

import { Login } from '@boxyhq/react-ui';

const Demo1 = () => {
  return <Login forwardTenant={async () => void 0} label='Tenant' />;
};

export default Demo1;
