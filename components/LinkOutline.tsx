import type { LinkProps } from './LinkBase';
import { LinkBase } from './LinkBase';

export const LinkOutline = ({ href, onClick, children, Icon = null, ...others }: LinkProps) => {
  return (
    <LinkBase href={href} onClick={onClick} className='btn-outline' Icon={Icon} {...others}>
      {children}
    </LinkBase>
  );
};
