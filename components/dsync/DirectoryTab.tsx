import Link from 'next/link';
import type { Directory } from '@lib/jackson';

const DirectoryTab = (props: { directory: Directory; activeTab: string }) => {
  const { directory, activeTab } = props;

  const menus = [
    {
      name: 'Directory',
      href: `/admin/directory-sync/${directory.id}`,
      active: activeTab === 'directory',
    },
    {
      name: 'Users',
      href: `/admin/directory-sync/${directory.id}/users`,
      active: activeTab === 'users',
    },
    {
      name: 'Groups',
      href: `/admin/directory-sync/${directory.id}/groups`,
      active: activeTab === 'groups',
    },
    {
      name: 'Webhook Events',
      href: `/admin/directory-sync/${directory.id}/events`,
      active: activeTab === 'events',
    },
  ];

  const classNames = 'inline-block p-4 rounded-t-lg border-b-2';

  return (
    <div className='mb-5 border-b border-gray-200 text-center text-sm font-medium text-gray-500 dark:border-gray-700 dark:text-gray-400'>
      <ul className='-mb-px flex flex-wrap'>
        {menus.map((menu) => {
          return (
            <li key={menu.name} className='mr-2'>
              <Link href={menu.href}>
                <a
                  className={
                    menu.active
                      ? `${classNames} active border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500`
                      : `${classNames} border-transparent hover:border-gray-300 hover:text-gray-600 dark:hover:text-gray-300`
                  }>
                  {menu.name}
                </a>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default DirectoryTab;
