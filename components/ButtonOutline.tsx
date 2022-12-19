import { ButtonBase } from './ButtonBase';
import classNames from 'classnames';

export const ButtonOutline = ({
  children = undefined,
  Icon = undefined,
  onClick = undefined,
  disabled = undefined,
  type = undefined,
  loading = undefined,
  className = undefined,
  ...others
}: {
  children?: any;
  disabled?: boolean;
  Icon?: any;
  onClick?: any;
  type?: 'submit' | 'reset' | 'button';
  loading?: boolean;
  className?: string;
}) => {
  return (
    <ButtonBase
      type={type}
      loading={loading}
      className={className || ''}
      disabled={disabled}
      variant='outline'
      onClick={onClick}
      {...others}>
      {Icon && <Icon className={classNames('h-4 w-4', children ? 'mr-1' : '')} aria-hidden />}
      {children}
    </ButtonBase>
  );
};
