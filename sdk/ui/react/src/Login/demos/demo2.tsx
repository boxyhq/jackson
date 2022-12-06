/**
 * @title Login Demo2 Title
 * @description Login demo2 description
 * @order 2
 */

import { Login } from '@boxyhq/sso-react';

const Demo2 = () => {
  return (
    <Login
      forwardTenant={async () => ({
        error: {
          message: 'Invalid team domain',
        },
      })}
      label='Team domain'
    />
  );
};

export default Demo2;
