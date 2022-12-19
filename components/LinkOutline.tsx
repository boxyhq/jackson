import type { LinkProps } from './LinkBase';
import { LinkBase } from './LinkBase';

export const LinkOutline = ({ href, children, Icon = null, ...others }: LinkProps) => {
  return (
    <LinkBase href={href} className='btn-outline' Icon={Icon} {...others}>
      {children}
    </LinkBase>
  );
};
