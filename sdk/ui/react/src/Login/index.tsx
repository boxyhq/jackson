import React from 'react';
import type { LoginProps } from './types';

const Login = (props: LoginProps) => (
  <form>
    <label htmlFor='tenant'></label>
    <input id='tenant'></input>
  </form>
);

export default Login;
