# @boxyhq/react-ui

UI components from [BoxyHQ](https://boxyhq.com/) for plug-and-play enterprise features.

## Installation

`npm install @boxyhq/react-ui --save`

## Usage

### SSO Login Component

There are mainly 2 ways of using the SSO Login Component as outlined below:

#### Preset value for `ssoIdentifier`

If a value is passed for `ssoIdentifier`, it would render a button that on click calls the passed-in handler (onSubmit) with the `ssoIdentifier` value. The handler can then initiate a redirect to the SSO service forwarding the value for ssoIdentifier.

```tsx
import { Login as SSOLogin } from '@boxyhq/react-ui';

const onSSOSubmit = async (ssoIdentifier: string) => {
  // Below calls signIn from next-auth. Replace this with whatever auth lib that you are using.
  await signIn('boxyhq-saml', undefined, { client_id: ssoIdentifier });
};

<SSOLogin
  buttonText={'Login with SSO'}
  ssoIdentifier={`tenant=${tenant}&product=${product}`}
  onSubmit={onSSOSubmit}
  classNames={{
    container: 'mt-2',
    button: 'btn-primary btn-block btn rounded-md active:-scale-95',
  }}
/>;
```

#### Accept input from the user for `ssoIdentifier`

If a value is not passed for `ssoIdentifier`, it would render an input field for the user to enter the `ssoIdentifier` value. And then on submit, the value gets passed to the handler. The handler can then initiate a redirect to the SSO service forwarding the value for ssoIdentifier.

```tsx
import { Login as SSOLogin } from '@boxyhq/react-ui';

const onSSOSubmit = async (ssoIdentifier: string) => {
  // Below calls signIn from next-auth. Replace this with whatever auth lib that you are using.
  await signIn('boxyhq-saml', undefined, { client_id: ssoIdentifier });
};

<SSOLogin
  buttonText={'Login with SSO'}
  onSubmit={onSSOSubmit}
  classNames={{
    container: 'mt-2',
    label: 'text-gray-400',
    button: 'btn-primary btn-block btn rounded-md active:-scale-95',
    input: 'input-bordered input mb-5 mt-2 w-full rounded-md',
  }}
/>;
```

#### Styling

If the classNames prop is passed in, we can override the default styling for each inner element. In case an inner element is omitted from the classNames prop, default styles will be set for the element. For example, In the below snippet, all the inner elements are styled by passing in the classNames for each inner one.

```tsx
<SSOLogin
  buttonText={'Login with SSO'}
  onSubmit={onSSOSubmit}
  classNames={{
    container: 'mt-2',
    label: 'text-gray-400',
    button: 'btn-primary btn-block btn rounded-md active:-scale-95',
    input: 'input-bordered input mb-5 mt-2 w-full rounded-md',
  }}
/>
```

Styling via style attribute is also supported for each inner element.
