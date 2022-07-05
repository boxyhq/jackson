import type { NextPage, GetServerSidePropsContext } from 'next';
import React from 'react';
import jackson from '@lib/jackson';
import { EyeIcon } from '@heroicons/react/outline';
import Link from 'next/link';
import EmptyState from '@components/EmptyState';
import Paginate from '@components/Paginate';
import DirectoryTab from '@components/dsync/DirectoryTab';
import { Badge } from '@supabase/ui';
import { inferSSRProps } from '@lib/inferSSRProps';

const UsersList: NextPage<inferSSRProps<typeof getServerSideProps>> = ({
  directory,
  users,
  pageOffset,
  pageLimit,
}) => {
  if (users?.length === 0 && pageOffset === 0) {
    return (
      <>
        <Header title={directory.name} />
        <DirectoryTab directory={directory} activeTab='users' />
        <div className='w-3/4'>
          <EmptyState title='No users found' />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title={directory.name} />
      <DirectoryTab directory={directory} activeTab='users' />
      <div className='w-3/4 rounded border'>
        <table className='w-full text-left text-sm text-gray-500 dark:text-gray-400'>
          <thead className='bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400'>
            <tr>
              <th scope='col' className='px-6 py-3'>
                First Name
              </th>
              <th scope='col' className='px-6 py-3'>
                Last Name
              </th>
              <th scope='col' className='px-6 py-3'>
                Email
              </th>
              <th scope='col' className='px-6 py-3'>
                Status
              </th>
              <th scope='col' className='px-6 py-3'>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users &&
              users.map((user) => {
                return (
                  <tr
                    key={user.id}
                    className='border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600'>
                    <td className='px-6 py-3'>{user.first_name}</td>
                    <td className='px-6 py-3'>{user.last_name}</td>
                    <td className='px-6 py-3'>{user.email}</td>
                    <td className='px-6 py-3'>
                      {user.active ? (
                        <Badge color='green'>Active</Badge>
                      ) : (
                        <Badge color='red'>Suspended</Badge>
                      )}
                    </td>
                    <td className='px-6 py-3'>
                      <Link href={`/admin/directory-sync/${directory.id}/users/${user.id}`}>
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
          itemsCount={users ? users.length : 0}
          path={`/admin/directory-sync/${directory.id}/users?`}
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

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const { directoryId, offset = 0 } = context.query;
  const { directorySyncController } = await jackson();

  const pageOffset = parseInt(offset as string);
  const pageLimit = 25;

  const { data: directory } = await directorySyncController.directories.get(directoryId as string);

  if (!directory) {
    return {
      notFound: true,
    };
  }

  const { data: users } = await directorySyncController.users
    .setTenantAndProduct(directory.tenant, directory.product)
    .list({ pageOffset, pageLimit });

  return {
    props: {
      directory,
      users,
      pageOffset,
      pageLimit,
    },
  };
};

export default UsersList;
