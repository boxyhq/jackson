import { useState, type ChangeEventHandler, type FormEvent } from 'react';
import useId from '../hooks/useId';
import type { LoginProps } from './types';

const DefaultErrorDisplayComponent = ({ id, error }) => {
  return <span id={id}>{error}</span>;
};

const Login = ({ forwardTenant, label, ErrorDisplayComponent }: LoginProps) => {
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

  let errorDisplay = null;
  if (errMsg) {
    errorDisplay =
      typeof ErrorDisplayComponent === 'function' ? (
        <ErrorDisplayComponent />
      ) : (
        <DefaultErrorDisplayComponent id={errorSpanId} error={errMsg} />
      );
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        value={tenant}
        onChange={handleChange}
        aria-invalid={!!errMsg}
        aria-describedby={errorSpanId}
      />
      {errorDisplay}
      <button type='submit'>Proceed</button>
    </form>
  );
};

export default Login;
