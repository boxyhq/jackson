import React, { useState } from 'react';
import useId from '../hooks/useId';
import type { LoginProps } from './types';

const Login = ({ signIn }: LoginProps) => {
  const id = useId('input');
  const [tenant, setTenant] = useState('');

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setTenant((e.currentTarget as HTMLInputElement).value);
  };

  return (
    <form onSubmit={() => signIn()}>
      <label htmlFor={id}></label>
      <input id={id} value={tenant} onChange={handleChange}></input>
    </form>
  );
};

export default Login;
