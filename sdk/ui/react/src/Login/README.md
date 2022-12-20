# Login

## Installation

```bash
npm install @boxyhq/react-ui
```

## Usage

```jsx
import { Login } from '@boxyhq/react-ui';

// Inside render
// onSubmit - Use the ssoIdentifier to resolve the SSO connection for Jackson SSO service
<Login onSubmit={async function(ssoIdentifier) {}}
  inputLabel='Tenant'
  buttonText='Sign-in with SSO'
  styles={{
    button: {color: '#fff'},
    input: {'margin-top': '2px'},
    label: {'font-size': '1.5rem'}}},
  classNames={{
    container: 'mt-2',
    button: 'btn-primary btn-block btn rounded-md',
    input: 'input-bordered input mb-5 mt-2 w-full rounded-md',
  }}
  buttonText="Sign-in with SSO"
/>;
```
