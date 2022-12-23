import classNames from 'classnames';
import type { LinkProps } from './LinkBase';
import { LinkBase } from './LinkBase';

export const LinkOutline = ({
  href,
  onClick,
  children,
  className = '',
  Icon = null,
  ...others
}: LinkProps) => {
  return (
    <LinkBase
      href={href}
      onClick={onClick}
      className={classNames('btn-outline', className)}
      Icon={Icon}
      {...others}>
      {children}
    </LinkBase>
  );
};
