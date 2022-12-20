import type { LinkProps } from './LinkBase';
import { LinkBase } from './LinkBase';

export const LinkPrimary = ({ href, onClick, children, Icon = null, ...others }: LinkProps) => {
  return (
    <LinkBase href={href} onClick={onClick} className='btn-primary' Icon={Icon} {...others}>
      {children}
    </LinkBase>
  );
};
