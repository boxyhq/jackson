import Link from 'next/link';

const DirectoryTab = (props: any) => {
  const { directory, activeTab } = props;

  const menus = [
    {
      name: 'Directory',
      href: `/admin/directory-sync/${directory.id}`,
      active: activeTab === 'directory'
    },
    {
      name: 'Users',
      href: `/admin/directory-sync/${directory.id}/users`,
      active: activeTab === 'users'
    },
    {
      name: 'Groups',
      href: `/admin/directory-sync/${directory.id}/groups`,
      active: activeTab === 'groups'
    },
    // {
    //   name: 'Events',
    //   href: `/admin/directory-sync/${directory.id}/events`,
    //   active: activeTab === 'events'
    // },
  ];

  const classNames = 'inline-block p-4 rounded-t-lg border-b-2';

  return (
    <div className="mb-5 text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:text-gray-400 dark:border-gray-700">
      <ul className="flex flex-wrap -mb-px">
        {menus.map((menu) => {
          return (
            <li key={menu.name} className="mr-2">
              <Link href={menu.href}>
                <a className={menu.active ? `${classNames} text-blue-600 border-blue-600 active dark:text-blue-500 dark:border-blue-500` : `${classNames} border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300`}>
                  {menu.name}
                </a>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  );
}

export default DirectoryTab;