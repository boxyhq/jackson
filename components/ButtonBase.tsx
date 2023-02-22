import classNames from 'classnames';
import { Button, type ButtonProps } from 'react-daisyui';

export interface ButtonBaseProps extends ButtonProps {
  Icon?: any;
}

export const ButtonBase = ({ Icon, children, ...others }: ButtonBaseProps) => {
  return (
    <Button {...others}>
      {Icon && <Icon className={classNames('h-4 w-4', children ? 'mr-1' : '')} aria-hidden />}
      {children}
    </Button>
  );
};
