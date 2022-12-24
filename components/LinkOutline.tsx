import classNames from 'classnames';
import { LinkBase } from './LinkBase';
import type { LinkBaseProps } from './LinkBase';

export const LinkOutline = ({ children, className, ...others }: LinkBaseProps) => {
  return (
    <LinkBase className={classNames('btn-outline', className)} {...others}>
      {children}
    </LinkBase>
  );
};
