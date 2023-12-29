import Link from 'next/link';
import type { Directory } from '@boxyhq/saml-jackson';
import classNames from 'classnames';
import { useTranslation } from 'next-i18next';

const DirectoryTab = ({
  directory,
  activeTab,
  setupLinkToken,
}: {
  directory: Directory;
  activeTab: string;
  setupLinkToken?: string;
}) => {
  const { t } = useTranslation('common');

  const menus = setupLinkToken
    ? [
        {
          name: t('directory'),
          href: `/setup/${setupLinkToken}/directory-sync/${directory.id}`,
          active: activeTab === 'directory',
        },
      ]
    : [
        {
          name: t('directory'),
          href: `/admin/directory-sync/${directory.id}`,
          active: activeTab === 'directory',
        },
        {
          name: t('users'),
          href: `/admin/directory-sync/${directory.id}/users`,
          active: activeTab === 'users',
        },
        {
          name: t('groups'),
          href: `/admin/directory-sync/${directory.id}/groups`,
          active: activeTab === 'groups',
        },
        {
          name: t('webhook_events'),
          href: `/admin/directory-sync/${directory.id}/events`,
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
