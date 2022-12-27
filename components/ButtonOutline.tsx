import type { ButtonBaseProps } from './ButtonBase';
import { ButtonBase } from './ButtonBase';

export const ButtonOutline = ({ children, ...other }: ButtonBaseProps) => {
  return (
    <ButtonBase variant='outline' {...other}>
      {children}
    </ButtonBase>
  );
};
