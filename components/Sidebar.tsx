import { SupportIcon, LogoutIcon, ShieldCheckIcon } from '@heroicons/react/solid';
import { NavItem } from './NavItem';

const menus = [
  {
    href: '/admin/saml/config',
    text: 'SAML SSO',
    icon: <ShieldCheckIcon className='mr-2 h-5 w-5' />,
  },
  {
    href: '#',
    text: 'Logout',
    icon: <LogoutIcon className='mr-2 h-5 w-5' />,
  },
  {
    href: 'https://boxyhq.com/docs',
    text: 'Docs & Guides',
    icon: <SupportIcon className='mr-2 h-5 w-5' />,
  },
];

export const Sidebar = () => {
  return (
    <>
      <aside
        className='transition-width fixed top-0 left-0 z-20 flex h-full w-64 flex-shrink-0 flex-col pt-16 duration-75 lg:flex'
        aria-label='Sidebar'>
        <div className='relative flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white pt-0'>
          <div className='flex flex-1 flex-col overflow-y-auto pt-5 pb-4'>
            <div className='flex-1 space-y-1 divide-y bg-white px-3'>
              <ul className='space-y-2 pb-2'>
                {menus.map((menu, index) => (
                  <li key={index}>
                    <NavItem href={menu.href} text={menu.text} icon={menu.icon} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </aside>
      <div className='fixed inset-0 z-10 hidden bg-gray-900 opacity-50' id='sidebarBackdrop' />
    </>
  );
};
