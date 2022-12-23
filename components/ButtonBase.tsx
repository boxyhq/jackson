import { Button } from 'react-daisyui';
import classNames from 'classnames';

export interface ButtonProps {
  children?: any;
  disabled?: boolean;
  Icon?: any;
  onClick?: any;
  type?: 'submit' | 'reset' | 'button';
  loading?: boolean;
  className?: string;
}

interface ButtonBaseProps extends ButtonProps {
  variant?: 'outline' | 'link';
  color?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'info' | 'success' | 'warning' | 'error';
}

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
}: ButtonBaseProps) => {
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
