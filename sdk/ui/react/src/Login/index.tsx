import { useState, type ChangeEventHandler } from 'react';
import useId from '../hooks/useId';
import type { LoginProps } from './types';

const Login = ({ signIn }: LoginProps) => {
  const id = useId('input');
  const [tenant, setTenant] = useState('');

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setTenant(e.currentTarget.value);
  };

  return (
    <form onSubmit={() => signIn(tenant)}>
      <label htmlFor={id}></label>
      <input id={id} value={tenant} onChange={handleChange}></input>
    </form>
  );
};

export default Login;
