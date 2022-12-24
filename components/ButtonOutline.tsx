import type { ButtonBaseProps } from './ButtonBase';
import { ButtonBase } from './ButtonBase';
import classNames from 'classnames';

export const ButtonOutline = ({ children, Icon, ...other }: ButtonBaseProps) => {
  return (
    <ButtonBase variant='outline' {...other}>
      {Icon && <Icon className={classNames('h-4 w-4', children ? 'mr-1' : '')} aria-hidden />}
      {children}
    </ButtonBase>
  );
};
