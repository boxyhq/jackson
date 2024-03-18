import Link from 'next/link';
import classNames from 'classnames';
import type { LinkProps } from 'react-daisyui';

export interface LinkBaseProps extends LinkProps {
  href: string;
  Icon?: any;
}

export const LinkBase = ({ children, href, className, Icon, ...others }: LinkBaseProps) => {
  return (
    <Link href={href} className={classNames('btn', className)} {...others} passHref>
      {Icon && <Icon className='mr-1 h-4 w-4' aria-hidden />}
      {children}
    </Link>
  );
};
