import { Button as ButtonDaisy } from 'react-daisyui';

export const Button = ({
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
    <ButtonDaisy
      type={type}
      color={color}
      loading={loading}
      className={className || ''}
      disabled={disabled}
      variant={variant}
      onClick={onClick}
      {...others}>
      {Icon && <Icon className={children ? 'mr-1 h-5 w-5' : 'h-5 w-5'} aria-hidden />}
      {children}
    </ButtonDaisy>
  );
};
