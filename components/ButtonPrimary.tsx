import type { ButtonProps } from './ButtonBase';
import { ButtonBase } from './ButtonBase';
import classNames from 'classnames';

export const ButtonPrimary = ({
  children = undefined,
  Icon = undefined,
  onClick = undefined,
  disabled = undefined,
  type = undefined,
  loading = undefined,
  className = undefined,
  ...others
}: ButtonProps) => {
  return (
    <ButtonBase
      type={type}
      color='primary'
      loading={loading}
      className={className || ''}
      disabled={disabled}
      onClick={onClick}
      {...others}>
      {Icon && <Icon className={classNames('h-4 w-4', children ? 'mr-1' : '')} aria-hidden />}
      {children}
    </ButtonBase>
  );
};
