/**
 * @title Login Component with failing onSubmit
 * @description If error object is returned with the error message, same would be displayed inline.
 * @order 4
 */

import { Login } from '@boxyhq/react-ui';

const Demo4 = () => {
  return (
    <Login
      onSubmit={async (ssoIdentifier) => ({
        error: {
          message: 'Invalid team domain',
        },
      })}
      inputLabel='Team domain *'
      placeholder='contoso@boxyhq.com'
    />
  );
};

export default Demo4;
