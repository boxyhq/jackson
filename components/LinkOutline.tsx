import { LinkBase } from './LinkBase';

export const LinkOutline = ({
  href,
  children,
  Icon = null,
  ...others
}: {
  href: string;
  children: any;
  Icon?: any;
}) => {
  return (
    <LinkBase href={href} className='btn-outline' Icon={Icon} {...others}>
      {children}
    </LinkBase>
  );
};
