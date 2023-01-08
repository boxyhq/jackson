/**
 * @title Login Component unstyled
 * @description Here we pass the ssoIdentifier directly instead of taking a user input.
 * @order 3
 */

import { Login } from '@boxyhq/react-ui';

const Demo3 = () => {
  return (
    <Login
      onSubmit={async (ssoIdentifier) => {
        // initiate the SSO flow here
      }}
      ssoIdentifier='some-identifier'
      unstyled
      buttonText='SIGN IN WITH SSO'
    />
  );
};

export default Demo3;
