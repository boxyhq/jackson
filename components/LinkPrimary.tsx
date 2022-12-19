import type { LinkProps } from './LinkBase';
import { LinkBase } from './LinkBase';

export const LinkPrimary = ({ href, children, Icon = null, ...others }: LinkProps) => {
  return (
    <LinkBase href={href} className='btn-primary' Icon={Icon} {...others}>
      {children}
    </LinkBase>
  );
};
