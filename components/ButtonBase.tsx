import { Button } from 'react-daisyui';
import classNames from 'classnames';

export const ButtonBase = ({
  children = undefined,
  Icon = undefined,
  onClick = undefined,
  disabled = undefined,
  variant = undefined,
  type = undefined,
  color = undefined,
  loading = undefined,
  className = undefined,
  ...others
}: {
  children?: any;
  disabled?: boolean;
  Icon?: any;
  onClick?: any;
  variant?: 'outline' | 'link';
  type?: 'submit' | 'reset' | 'button';
  color?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'info' | 'success' | 'warning' | 'error';
  loading?: boolean;
  className?: string;
}) => {
  return (
    <Button
      type={type}
      color={color}
      loading={loading}
      className={className || ''}
      disabled={disabled}
      variant={variant}
      onClick={onClick}
      {...others}>
      {Icon && <Icon className={classNames('h-4 w-4', children ? 'mr-1' : '')} aria-hidden />}
      {children}
    </Button>
  );
};
