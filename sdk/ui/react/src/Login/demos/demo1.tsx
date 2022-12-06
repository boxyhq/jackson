/**
 * @title Login Demo1 Title
 * @description Login demo1 description
 * @order 1
 */

import { Login } from '@boxyhq/sso-react';

const Demo1 = () => {
  return <Login forwardTenant={async () => void 0} label='Tenant' />;
};

export default Demo1;
