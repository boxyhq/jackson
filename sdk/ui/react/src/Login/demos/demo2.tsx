/**
 * @title Login Component with default styles
 * @description Login Component with a failing onSubmit. Type something and submit. It displays the error inline.
 * @order 2
 */

import { Login } from '@boxyhq/react-ui';

const Demo2 = () => {
  return (
    <Login
      onSubmit={async (ssoIdentifier) => ({
        error: {
          message: 'Invalid team domain',
        },
      })}
      inputLabel='Team domain'
    />
  );
};

export default Demo2;
