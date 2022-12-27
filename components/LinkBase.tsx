import Link from 'next/link';
import classNames from 'classnames';

export type LinkProps = {
  href: string;
  children: any;
  Icon?: any;
  onClick?: any;
  target?: string;
  rel?: string;
  className?: string;
  style?: any;
};

export const LinkBase = ({
  href,
  onClick,
  className = '',
  children,
  target,
  rel,
  Icon = null,
  style,
  ...others
}: LinkProps) => {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={classNames('btn m-2', className)}
      target={target}
      rel={rel}
      style={style}
      {...others}>
      {Icon && <Icon className='mr-1 h-4 w-4' aria-hidden />}
      {children}
    </Link>
  );
};
