import type { NextPage, GetServerSideProps } from 'next';
import type { Directory, Group } from '@lib/jackson';
import React from 'react';
import jackson from '@lib/jackson';
import EmptyState from '@components/EmptyState';
import Link from 'next/link';
import { EyeIcon } from '@heroicons/react/outline';
import Paginate from '@components/Paginate';
import DirectoryTab from '@components/dsync/DirectoryTab';

const GroupsList: NextPage<{
  directory: Directory;
  groups: Group[];
  pageOffset: number;
  pageLimit: number;
}> = ({ directory, groups, pageOffset, pageLimit }) => {
  if (groups.length === 0 && pageOffset === 0) {
    return (
      <>
        <Header title={directory.name} />
        <DirectoryTab directory={directory} activeTab='groups' />
        <div className='w-3/4'>
          <EmptyState title='No groups found' />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title={directory.name} />
      <DirectoryTab directory={directory} activeTab='groups' />
      <div className='w-3/4 rounded border'>
        <table className='w-full table-fixed text-left text-sm text-gray-500 dark:text-gray-400'>
          <thead className='bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400'>
            <tr>
              <th scope='col' className='w-5/6 px-6 py-3'>
                Name
              </th>
              <th scope='col' className='w-1/6 px-6 py-3'>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => {
              return (
                <tr
                  key={group.id}
                  className='border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600'>
                  <td className='px-6 py-3'>{group.name}</td>
                  <td className='px-6 py-3'>
                    <Link href={`/admin/directory-sync/${directory.id}/groups/${group.id}`}>
                      <a>
                        <EyeIcon className='h-5 w-5' />
                      </a>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Paginate
          pageOffset={pageOffset}
          pageLimit={pageLimit}
          itemsCount={groups.length}
          path={`/admin/directory-sync/${directory.id}/groups?`}
        />
      </div>
    </>
  );
};

const Header = ({ title }) => {
  return (
    <div className='mb-4 flex items-center justify-between'>
      <h2 className='font-bold text-primary dark:text-white md:text-2xl'>{title}</h2>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { directoryId, offset = 0 } = context.query;
  const { directorySync } = await jackson();

  const pageOffset = parseInt(offset as string);
  const pageLimit = 25;

  const directory = await directorySync.directories.get(directoryId as string);

  const groups = await directorySync.groups
    .setTenantAndProduct(directory.tenant, directory.product)
    .list({ pageOffset, pageLimit });

  return {
    props: {
      directory,
      groups,
      pageOffset,
      pageLimit,
    },
  };
};

export default GroupsList;
