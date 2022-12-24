import Link from 'next/link';
import classNames from 'classnames';
import type { LinkProps } from 'react-daisyui';

export interface LinkBaseProps extends LinkProps {
  Icon?: any;
  href: string;
}

export const LinkBase = ({ href, className, target, rel, children, Icon, ...others }: LinkBaseProps) => {
  return (
    <Link href={href} className={classNames('btn', className)} target={target} rel={rel} {...others}>
      {Icon && <Icon className='mr-1 h-4 w-4' aria-hidden />}
      {children}
    </Link>
  );
};
