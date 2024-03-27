import HomeIcon from '@heroicons/react/24/outline/HomeIcon';
import Image from 'next/image';
import Link from 'next/link';
import classNames from 'classnames';
import { useRouter } from 'next/router';

import Logo from '../public/logo.png';
import { useTranslation } from 'next-i18next';
import SSOLogo from '@components/logo/SSO';
import DSyncLogo from '@components/logo/DSync';
import AuditLogsLogo from '@components/logo/AuditLogs';
import Vault from '@components/logo/Vault';
import Cog8ToothIcon from '@heroicons/react/24/outline/Cog8ToothIcon';

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
      icon: SSOLogo,
      active: asPath.includes('/admin/sso-connection') || asPath.includes('/admin/federated-saml'),
      items: [
        {
          href: '/admin/sso-connection',
          text: t('connections'),
          active:
            asPath.includes('/admin/sso-connection') && !asPath.includes('/admin/sso-connection/setup-link'),
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
        {
          href: '/admin/sso-tracer',
          text: t('bui-tracer-title'),
          active: asPath.includes('/admin/sso-tracer'),
        },
      ],
    },
    {
      href: '/admin/directory-sync',
      text: t('directory_sync'),
      icon: DSyncLogo,
      active: asPath.includes('/admin/directory-sync'),
      items: [
        {
          href: '/admin/directory-sync',
          text: t('connections'),
          active:
            asPath.includes('/admin/directory-sync') && !asPath.includes('/admin/directory-sync/setup-link'),
        },
        {
          href: '/admin/directory-sync/setup-link',
          text: t('setup_links'),
          active: asPath.includes('/admin/directory-sync/setup-link'),
        },
      ],
    },
    {
      href: '/admin/retraced',
      text: t('audit_logs'),
      icon: AuditLogsLogo,
      current: asPath.includes('retraced'),
      active: asPath.includes('/admin/retraced'),
      items: [
        {
          href: '/admin/retraced',
          text: t('projects'),
          active: asPath.includes('/admin/retraced'),
        },
      ],
    },
    {
      href: '/admin/terminus',
      text: t('privacy_vault'),
      icon: Vault,
      current: asPath.includes('terminus'),
      active: asPath.includes('/admin/terminus'),
      items: [
        {
          href: '/admin/terminus',
          text: t('policies'),
          active: asPath.includes('/admin/terminus'),
        },
      ],
    },
    {
      href: '/admin/settings',
      text: t('settings'),
      icon: Cog8ToothIcon,
      active: asPath.includes('/admin/settings'),
      items: [
        {
          href: '/admin/settings/sso-connection',
          text: 'Single Sign-On',
          active: asPath.includes('/admin/settings/sso-connection'),
        },
        {
          href: '/admin/settings/branding',
          text: 'Branding',
          active: asPath.includes('/admin/settings/branding'),
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
                <span className='ml-4 text-xl font-bold text-gray-900'>{t('boxyhq_admin_portal')}</span>
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
              <span className='ml-4 text-lg font-bold text-gray-900'>{t('boxyhq_admin_portal')}</span>
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
            <ItemLink key={id} {...menu} />
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
      <div className='mt-1 space-y-1 border-l-2 border-gray-200'>
        {items.map((item, id) => (
          <ItemLink key={id} {...item} />
        ))}
      </div>
    </nav>
  );
};

const ItemLink = (props: MenuItem) => {
  const { href, text, active } = props;

  return (
    <Link
      href={href}
      className={classNames(
        'group mx-2 flex items-center rounded-md py-2 px-2 text-sm text-gray-900',
        active ? 'bg-gray-100 font-bold' : 'font-medium hover:bg-gray-100 hover:text-gray-900'
      )}>
      {props.icon && <props.icon className='mr-2 h-6 w-6 flex-shrink-0' aria-hidden='true' />}
      {text}
    </Link>
  );
};
