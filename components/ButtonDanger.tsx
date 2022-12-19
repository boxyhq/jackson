import { Button } from './Button';
import classNames from 'classnames';

export const ButtonDanger = ({
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
    <Button
      type={type}
      color='error'
      loading={loading}
      className={className || ''}
      disabled={disabled}
      onClick={onClick}
      {...others}>
      {Icon && <Icon className={classNames('h-4 w-4', children ? 'mr-1' : '')} aria-hidden />}
      {children}
    </Button>
  );
};
