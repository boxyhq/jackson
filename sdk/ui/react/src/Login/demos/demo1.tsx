/**
 * @title Login Component with the supported props
 * @description Refer the code below to see the passed props.
 * @order 1
 */

import { Login } from '@boxyhq/react-ui';

const Demo1 = () => {
  return (
    <Login
      onSubmit={async (ssoIdentifier) => {
        // initiate the SSO flow here
      }}
      styles={{
        container: {
          '--input-outline-color': 'hsl(0 0% 20%/ 0.2)',
          '--btn-hover-bg-color': 'hsl(0 0% 20%)',
          '--btn-outline-color': 'hsl(219 14% 22%),',
        },
      }}
      placeholder='contoso@boxyhq.com'
      classNames={{
        container: 'cls1',
        input: 'input1',
        label: 'label1',
        button: 'button1',
      }}
      inputLabel='Team Domain'
      buttonText='Login with SSO'
    />
  );
};

export default Demo1;
