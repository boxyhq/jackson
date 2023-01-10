import { useState, type ChangeEventHandler, type FormEvent } from 'react';
import type { LoginProps } from './types';
import useId from '../hooks/useId';
import cssClassAssembler from '../utils/cssClassAssembler';
import defaultClasses from './index.module.css';

const COMPONENT = 'sso';

const Login = ({
  ssoIdentifier = '',
  onSubmit,
  inputLabel = 'Tenant',
  placeholder = '',
  buttonText = 'Sign-in with SSO',
  styles,
  classNames,
  innerProps,
}: LoginProps) => {
  // Generate stable html id attributes for input/span elements
  const inputId = useId(COMPONENT, 'input');
  const errorSpanId = useId(COMPONENT, 'span');
  // States for ssoIdentifier input and error message
  const [_ssoIdentifier, _setSsoIdentifier] = useState('');
  const [errMsg, setErrMsg] = useState('');
  // input event listener
  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setErrMsg(''); // clear error if any
    _setSsoIdentifier(e.currentTarget.value);
  };
  // state for button submission
  const [isProcessing, setIsProcessing] = useState(false);
  // call onSubmit passing the _ssoIdentifier or the preset ssoIdentifier from props
  const onButtonClick = async (e: FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    const {
      error: { message },
    } = (await onSubmit(_ssoIdentifier || ssoIdentifier)) || { error: {} };
    setIsProcessing(false);
    if (typeof message === 'string' && message) {
      setErrMsg(message);
    }
  };

  const isError = !!errMsg;
  // if preset ssoIdentifier not passed in, then render input UI
  const shouldRenderInput = !ssoIdentifier;

  const inputUI = shouldRenderInput ? (
    <>
      <label
        htmlFor={inputId}
        style={styles?.label}
        className={cssClassAssembler(classNames?.label, defaultClasses.label)}>
        {inputLabel}
      </label>
      <input
        id={inputId}
        value={_ssoIdentifier}
        placeholder={placeholder}
        onChange={handleChange}
        style={styles?.input}
        className={cssClassAssembler(classNames?.input, defaultClasses.input)}
        aria-invalid={isError}
        aria-describedby={errorSpanId}
        {...innerProps?.input}
      />
      {isError && <span id={errorSpanId}>{errMsg}</span>}
    </>
  ) : null;

  const disableButton = !(_ssoIdentifier || ssoIdentifier) || isProcessing;

  return (
    <div
      className={cssClassAssembler(classNames?.container, defaultClasses.container)}
      style={styles?.container}>
      {inputUI}
      <button
        disabled={disableButton}
        type='button'
        onClick={onButtonClick}
        style={styles?.button}
        className={cssClassAssembler(classNames?.button, defaultClasses.button)}
        {...innerProps?.button}>
        {buttonText}
      </button>
    </div>
  );
};

export default Login;
