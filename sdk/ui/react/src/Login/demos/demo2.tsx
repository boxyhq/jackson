/**
 * @title Login Component with default styles
 * @description Login Component with a failing forwardTenant
 * @order 2
 */

import { Login } from '@boxyhq/react-ui';

const Demo2 = () => {
  return (
    <Login
      onSubmit={async () => ({
        error: {
          message: 'Invalid team domain',
        },
      })}
      inputLabel='Team domain'
    />
  );
};

export default Demo2;
