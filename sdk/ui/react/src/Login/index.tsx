import { useState, type ChangeEventHandler, type FormEvent } from 'react';
import type { LoginProps } from './types';
import useId from '../hooks/useId';
import cssClassAssembler from '../utils/cssClassAssembler';
import defaultClasses from './index.module.css';

const COMPONENT = 'sso';

const Login = ({ forwardTenant, label, styles, classNames, unstyled = false }: LoginProps) => {
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
    } = (await forwardTenant(tenant)) || { error: {} };
    if (typeof message === 'string' && message) {
      setErrMsg(message);
    }
  };

  const isError = !!errMsg;

  return (
    <form
      onSubmit={handleSubmit}
      className={cssClassAssembler(unstyled, classNames?.container, defaultClasses.form)}>
      <label
        htmlFor={inputId}
        style={styles?.label}
        className={cssClassAssembler(unstyled, classNames?.label, defaultClasses.label)}>
        {label}
      </label>
      <input
        id={inputId}
        value={tenant}
        onChange={handleChange}
        style={styles?.input}
        className={cssClassAssembler(unstyled, classNames?.input, defaultClasses.input)}
        aria-invalid={isError}
        aria-describedby={errorSpanId}
      />
      {isError && <span id={errorSpanId}>{errMsg}</span>}
      <button
        type='submit'
        style={styles?.button}
        className={cssClassAssembler(unstyled, classNames?.button, defaultClasses.button)}>
        Proceed
      </button>
    </form>
  );
};

export default Login;
