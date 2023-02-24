import { ButtonBase, type ButtonBaseProps } from './ButtonBase';

export const ButtonLink = ({ children, ...other }: ButtonBaseProps) => {
  return (
    <ButtonBase variant='link' {...other}>
      {children}
    </ButtonBase>
  );
};
