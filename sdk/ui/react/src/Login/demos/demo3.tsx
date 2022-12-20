/**
 * @title Login Component unstyled
 * @description Login Component unstyled
 * @order 3
 */

import { Login } from '@boxyhq/react-ui';

const Demo3 = () => {
  return (
    <Login
      onSubmit={async () => {
        //return nothing
      }}
      ssoIdentifier='some-identifier'
      unstyled
      buttonText='SIGN IN WITH SSO'
    />
  );
};

export default Demo3;
