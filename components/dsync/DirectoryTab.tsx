import Link from 'next/link';
import type { Directory } from '@lib/jackson';
import classNames from 'classnames';

const DirectoryTab = (props: { directory: Directory; activeTab: string; token?: any }) => {
  const { directory, activeTab, token } = props;

  const menus = token
    ? [
        {
          name: 'Directory',
          href: token
            ? `/setup/${token}/directory-sync/${directory.id}`
            : `/admin/directory-sync/${directory.id}`,
          active: activeTab === 'directory',
        },
      ]
    : [
        {
          name: 'Directory',
          href: token
            ? `/setup/${token}/directory-sync/${directory.id}`
            : `/admin/directory-sync/${directory.id}`,
          active: activeTab === 'directory',
        },
        {
          name: 'Users',
          href: token
            ? `/setup/${token}/directory-sync/${directory.id}/users`
            : `/admin/directory-sync/${directory.id}/users`,
          active: activeTab === 'users',
        },
        {
          name: 'Groups',
          href: token
            ? `/setup/${token}/directory-sync/${directory.id}/groups`
            : `/admin/directory-sync/${directory.id}/groups`,
          active: activeTab === 'groups',
        },
        {
          name: 'Webhook Events',
          href: token
            ? `/setup/${token}/directory-sync/${directory.id}/events`
            : `/admin/directory-sync/${directory.id}/events`,
          active: activeTab === 'events',
        },
      ];

  return (
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
  );
};

export default DirectoryTab;
