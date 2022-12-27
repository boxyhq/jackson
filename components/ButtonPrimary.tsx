import type { ButtonBaseProps } from './ButtonBase';
import { ButtonBase } from './ButtonBase';

export const ButtonPrimary = ({ children, ...other }: ButtonBaseProps) => {
  return (
    <ButtonBase color='primary' {...other}>
      {children}
    </ButtonBase>
  );
};
