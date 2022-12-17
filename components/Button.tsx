import { Button as ButtonDaisy } from 'react-daisyui';

export const Button = ({
  children,
  Icon = undefined,
  onClick = undefined,
  disabled = undefined,
  variant = undefined,
  ...others
}: {
  children: any;
  disabled?: boolean;
  Icon?: any;
  onClick?: any;
  variant?: 'outline' | 'link';
}) => {
  return (
    <ButtonDaisy className='m-2' disabled={disabled} variant={variant} onClick={onClick} {...others}>
      {Icon && <Icon className='mr-1 h-5 w-5' aria-hidden />}
      {children}
    </ButtonDaisy>
  );
};
