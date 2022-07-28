import NextLink from 'next/link';
import { useRouter } from 'next/router';
import classNames from 'classnames';
// import { signOut } from 'next-auth/react';

export const NavItem = (props: {
  href: string;
  text: string;
  icon: any;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}) => {
  const router = useRouter();

  const { href, text, onClick } = props;
  const isActive = router.asPath === href;
  const Icon = props.icon;

  return (
    <NextLink href={href}>
      <a
        href={href}
        onClick={onClick}
        className={classNames(
          isActive ? 'bg-gray-100' : '',
          'flex items-center rounded-lg p-2 text-base font-normal text-gray-900 hover:bg-gray-100'
        )}>
        {Icon}
        <span className='ml-3'>{text}</span>
      </a>
    </NextLink>
  );
};
