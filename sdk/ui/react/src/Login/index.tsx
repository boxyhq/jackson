import { useState, type ChangeEventHandler, type FormEvent } from 'react';
import useId from '../hooks/useId';
import type { LoginProps } from './types';
import defaultClasses from './index.module.css';

const COMPONENT = 'sso';

const Login = ({ forwardTenant, label, styles, classNames, unstyled }: LoginProps) => {
  const inputId = useId(COMPONENT, 'input');
  const errorSpanId = useId(COMPONENT, 'span');
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
    <form onSubmit={handleSubmit} className={`${defaultClasses.form} ${classNames?.container || ''}`}>
      <label
        htmlFor={inputId}
        style={styles?.label}
        className={`${defaultClasses.label} ${classNames?.label || ''}`}>
        {label}
      </label>
      <input
        id={inputId}
        value={tenant}
        onChange={handleChange}
        style={styles?.input}
        className={`${defaultClasses.input} ${classNames?.input || ''}`}
        aria-invalid={isError}
        aria-describedby={errorSpanId}
      />
      {isError && <span id={errorSpanId}>{errMsg}</span>}
      <button
        type='submit'
        style={styles?.button}
        className={`${defaultClasses.button} ${classNames?.button}`}>
        Proceed
      </button>
    </form>
  );
};

export default Login;
