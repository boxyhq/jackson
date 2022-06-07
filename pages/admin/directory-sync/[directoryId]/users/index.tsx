import type { NextPage, GetServerSideProps } from 'next';
import type { Directory, User } from '@lib/jackson';
import React from 'react';
import jackson from '@lib/jackson';
import { Badge } from '@supabase/ui'
import DirectoryTab from '@components/dsync/DirectoryTab';
import { EyeIcon } from '@heroicons/react/outline';
import Link from 'next/link';
import EmptyState from '@components/EmptyState';

const UsersList: NextPage<{ directory: Directory, users: User[] }> = ({ directory, users }) => {
  if(users.length === 0) {
    return (
      <>
        <Header title={directory.name} />
        <DirectoryTab directory={directory} activeTab="users" />
        <EmptyState title="No users found" />
      </>
    )
  }

  return (
    <>
      <Header title={directory.name} />
      <DirectoryTab directory={directory} activeTab="users" />
      <div className='rounded border w-3/4'>
        <table className="table-fixed w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">
                First Name
              </th>
              <th scope="col" className="px-6 py-3">
                Last Name
              </th>
              <th scope="col" className="px-6 py-3">
                Email
              </th>
              <th scope="col" className="px-6 py-3">
                State
              </th>
              <th scope="col" className="px-6 py-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              return (
                <tr key={user.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <td className="px-6 py-3">{user.first_name}</td>
                  <td className="px-6 py-3">{user.last_name}</td>
                  <td className="px-6 py-3">{user.email}</td>
                  <td className="px-6 py-3">{user.raw?.active ? <Badge size="small">Active</Badge> : <Badge size="small" color="red">Suspended</Badge>}</td>
                  <td className="px-6 py-3">
                    <Link href={`/admin/directory-sync/${directory.id}/users/${user.id}`}>
                      <a>
                        <EyeIcon className='h-5 w-5' />
                      </a>
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

const Header = ({title}) => {
  return (
    <div className='flex items-center justify-between mb-4'>
      <h2 className='font-bold text-primary dark:text-white md:text-2xl'>{title}</h2>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { directoryId } = context.query;
  const { directorySync } = await jackson();

  return {
    props: {
      directory: await directorySync.directories.get(directoryId as string),
      users: await directorySync.directories.listUsers({ directory: directoryId as string })
    },
  }
}

export default UsersList;