import { ShieldCheckIcon, UsersIcon, HomeIcon } from '@heroicons/react/20/solid';
import Image from 'next/image';
import Link from 'next/link';
import classNames from 'classnames';
import { useRouter } from 'next/router';

import Logo from '../public/logo.png';
import { useTranslation } from 'next-i18next';

type SidebarProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
};

type MenuItem = {
  href: string;
  text: string;
  active: boolean;
  icon?: any;
  items?: MenuItem[];
};

export const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const { t } = useTranslation('common');
  const { asPath } = useRouter();

  const menus = [
    {
      href: '/admin/dashboard',
      text: t('dashboard'),
      icon: HomeIcon,
      active: asPath.includes('/admin/dashboard'),
    },
    {
      href: '/admin/sso-connection',
      text: t('enterprise_sso'),
      icon: ShieldCheckIcon,
      active: asPath.includes('/admin/sso-connection') || asPath.includes('/admin/federated-saml'),
      items: [
        {
          href: '/admin/sso-connection',
          text: t('connections'),
          active: asPath === '/admin/sso-connection',
        },
        {
          href: '/admin/sso-connection/setup-link',
          text: t('setup_links'),
          active: asPath.includes('/admin/sso-connection/setup-link'),
        },
        {
          href: '/admin/federated-saml',
          text: t('saml_federation'),
          active: asPath.includes('/admin/federated-saml'),
        },
      ],
    },
    {
      href: '/admin/directory-sync',
      text: t('directory_sync'),
      icon: UsersIcon,
      active: asPath.includes('/admin/directory-sync'),
      items: [
        {
          href: '/admin/directory-sync',
          text: t('connections'),
          active: asPath === '/admin/directory-sync',
        },
        {
          href: '/admin/directory-sync/setup-link',
          text: t('setup_links'),
          active: asPath.includes('/admin/directory-sync/setup-link'),
        },
      ],
    },
  ];

  return (
    <>
      {/* Sidebar for mobile */}
      <div
        className={classNames('relative z-40 md:hidden', { hidden: isOpen })}
        role='dialog'
        aria-modal='true'>
        <div className='fixed inset-0 bg-gray-600 bg-opacity-75' />
        <div className='fixed inset-0 z-40 flex'>
          <div className='relative flex w-full max-w-xs flex-1 flex-col bg-white pt-5 pb-4'>
            <div className='absolute top-0 right-0 -mr-12 pt-2'>
              <button
                onClick={() => {
                  setIsOpen(!isOpen);
                }}
                type='button'
                className='ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white'>
                <span className='sr-only'>{t('close_sidebar')}</span>
                <svg
                  className='h-6 w-6 text-white'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={2}
                  stroke='currentColor'
                  aria-hidden='true'>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>
            </div>
            <div className='flex flex-shrink-0 items-center px-4'>
              <Link href='/' className='flex items-center'>
                <Image src={Logo} alt='BoxyHQ' width={36} height={36} className='h-8 w-auto' />
                <span className='ml-4 text-xl font-bold text-gray-900'>BoxyHQ Admin Portal</span>
              </Link>
            </div>
            <div className='mt-5 h-0 flex-1 overflow-y-auto'>
              <MenuItems menus={menus} />
            </div>
          </div>
          <div className='w-14 flex-shrink-0' aria-hidden='true'></div>
        </div>
      </div>

      {/* Sidebar for desktop */}
      <div className='hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col'>
        <div className='flex flex-grow flex-col overflow-y-auto border-r border-gray-200 bg-white pt-5'>
          <div className='flex flex-shrink-0 items-center px-4'>
            <Link href='/' className='flex items-center'>
              <Image src={Logo} alt='BoxyHQ' width={36} height={36} className='h-8 w-auto' />
              <span className='ml-4 text-lg font-bold text-gray-900'>BoxyHQ Admin Portal</span>
            </Link>
          </div>
          <div className='mt-5 flex flex-1 flex-col'>
            <MenuItems menus={menus} />
          </div>
        </div>
      </div>
    </>
  );
};

const MenuItems = ({ menus }: { menus: MenuItem[] }) => {
  return (
    <nav className='space-y-1'>
      {menus.map((menu, id) => {
        return (
          <div key={id}>
            <Link
              href={menu.href}
              className={classNames(
                'group mx-2 flex items-center rounded-md px-2 py-2 text-sm text-gray-900 hover:bg-gray-100 hover:text-gray-900',
                menu.active ? 'font-bold' : 'font-medium'
              )}>
              <menu.icon className='mr-2 h-5 w-5 flex-shrink-0' aria-hidden='true' />
              {menu.text}
            </Link>
            {menu.items && <SubMenuItems items={menu.items} />}
          </div>
        );
      })}
    </nav>
  );
};

const SubMenuItems = ({ items }: { items: MenuItem[] }) => {
  return (
    <nav className='flex-1 pl-10'>
      <div className='mt-2 space-y-1 border-l-2 border-gray-200'>
        {items.map((item, id) => (
          <Link
            key={id}
            href={item.href}
            className={classNames(
              'group mx-2 flex items-center rounded-md py-2 px-2 pr-2 text-sm text-gray-900',
              item.active ? 'bg-gray-100 font-bold' : 'font-medium hover:bg-gray-100 hover:text-gray-900'
            )}>
            {item.text}
          </Link>
        ))}
      </div>
    </nav>
  );
};
