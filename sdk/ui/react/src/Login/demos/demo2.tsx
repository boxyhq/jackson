/**
 * @title Login Component with default styles
 * @description If classNames prop is not passed in, then default styling will be applied. Also supported is the passing of style attribute for each inner element (Note that inline style will override other styles).
 * @order 2
 */

import { Login } from '@boxyhq/react-ui';

const Demo2 = () => {
  return (
    <Login
      onSubmit={async (ssoIdentifier) => {
        // initiate the SSO flow here
      }}
      styles={{
        input: {
          '--input-outline-color': 'hsl(0 0% 20%/ 0.2)',
        },
        button: {
          '--btn-hover-bg-color': 'hsl(0 0% 20%)',
          '--btn-outline-color': 'hsl(219 14% 22%),',
        },
      }}
      inputLabel='Team domain *'
      placeholder='contoso@boxyhq.com'
    />
  );
};

export default Demo2;
