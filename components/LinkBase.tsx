import Link from 'next/link';
import classNames from 'classnames';

export const LinkBase = ({
  href,
  className = '',
  children,
  Icon = null,
  ...others
}: {
  href: string;
  children: any;
  Icon?: any;
  className?: string;
}) => {
  return (
    <Link href={href} className={classNames('btn m-2', className)} {...others}>
      {Icon && <Icon className='mr-1 h-4 w-4' aria-hidden />}
      {children}
    </Link>
  );
};
