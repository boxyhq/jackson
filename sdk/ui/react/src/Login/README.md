# Login

## Installation

```bash
npm install @boxyhq/react-ui
```

## Usage

```jsx
import { Login } from '@boxyhq/react-ui';

// Inside render
<Login onSubmit={async function(ssoIdentifier) {
  // Use the ssoIdentifier to resolve the SSO connection for the SSO service
}}
  inputLabel='Tenant'
  buttonText='Sign-in with SSO'
  placeholder='contoso@boxyhq.com'
  styles={{
    container: {'--btn-outline-color': '219 14% 22%'}
    button: {color: '#fff'},
    input: {marginTop: '2px'},
    label: {fontSize: '1.5rem'}}},
  classNames={{
    container: 'mt-2',
    button: 'btn-primary btn-block btn rounded-md',
    input: 'input-bordered input mb-5 mt-2 w-full rounded-md',
  }}
  buttonText="Sign-in with SSO"
/>;
```
