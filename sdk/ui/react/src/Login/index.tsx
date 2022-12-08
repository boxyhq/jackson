import { useState, type ChangeEventHandler, type FormEvent } from 'react';
import useId from '../hooks/useId';
import type { LoginProps } from './types';

const Login = ({ forwardTenant, label }: LoginProps) => {
  const inputId = useId('input');
  const errorSpanId = useId('span');
  const [tenant, setTenant] = useState('');
  const [errMsg, setErrMsg] = useState('');

  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setErrMsg('');
    setTenant(e.currentTarget.value);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrMsg('');
    const {
      error: { message },
    } = await forwardTenant(tenant);
    if (typeof message === 'string' && message) {
      setErrMsg(message);
    }
  };

  const isError = !!errMsg;

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        value={tenant}
        onChange={handleChange}
        aria-invalid={isError}
        aria-describedby={errorSpanId}
      />
      {isError && <span id={errorSpanId}>{errMsg}</span>}
      <button type='submit'>Proceed</button>
    </form>
  );
};

export default Login;
