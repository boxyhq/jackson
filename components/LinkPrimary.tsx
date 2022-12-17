import Link from 'next/link';

export const LinkPrimary = ({ href, children, ...others }) => {
  return (
    <Link href={href} className='btn-primary btn m-2' {...others}>
      {children}
    </Link>
  );
};
