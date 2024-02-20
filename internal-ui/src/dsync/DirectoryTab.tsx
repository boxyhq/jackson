import Link from 'next/link';
import classNames from 'classnames';
import { useTranslation } from 'next-i18next';

// TODO:
// Handle display for setuplink view (hide the users, groups, events)

type Tabs = 'directory' | 'users' | 'groups' | 'events';

export const DirectoryTab = ({ activeTab, baseUrl }: { activeTab: Tabs; baseUrl: string }) => {
  const { t } = useTranslation('common');

  const menus = [
    {
      name: t('directory'),
      href: baseUrl,
      active: activeTab === 'directory',
    },
    {
      name: t('users'),
      href: `${baseUrl}/users`,
      active: activeTab === 'users',
    },
    {
      name: t('groups'),
      href: `${baseUrl}/groups`,
      active: activeTab === 'groups',
    },
    {
      name: t('webhook_events'),
      href: `${baseUrl}/events`,
      active: activeTab === 'events',
    },
  ];

  return (
    <div className='pb-3'>
      <nav className='-mb-px flex space-x-5 border-b' aria-label='Tabs'>
        {menus.map((menu) => {
          return (
            <Link
              href={menu.href}
              key={menu.href}
              className={classNames(
                'inline-flex items-center border-b-2 py-4 text-sm font-medium',
                menu.active
                  ? 'border-gray-700 text-gray-700'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              )}>
              {menu.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
