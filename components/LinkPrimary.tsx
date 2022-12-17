import Link from 'next/link';

export const LinkPrimary = ({
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
    <Link href={href} className='btn-primary btn m-2' {...others}>
      {Icon && <Icon className='mr-1 h-5 w-5' aria-hidden />}
      {children}
    </Link>
  );
};
