import { NextPage, GetServerSideProps } from 'next';
import React from 'react';
import jackson from '@lib/jackson';
import { Badge } from '@supabase/ui'
import DirectoryTab from '@components/dsync/DirectoryTab';
import { EyeIcon } from '@heroicons/react/outline';
import Link from 'next/link';

const UsersList: NextPage = (props: any) => {
  const { directory, users } = props;

  return (
    <div>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='font-bold text-primary dark:text-white md:text-2xl'>{directory.name}</h2>
      </div>
      <DirectoryTab directory={directory} activeTab="users" />
      <div className='rounded border'>
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
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
                Groups
              </th>
              <th scope="col" className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              return (
                <tr key={user.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <td className="px-6 py-3">{user.first_name}</td>
                  <td className="px-6 py-3">{user.last_name}</td>
                  <td className="px-6 py-3">{user.email}</td>
                  <td className="px-6 py-3">{user.raw.active ? <Badge size="small">Active</Badge> : <Badge size="small" color="red">Suspended</Badge>}</td>
                  <td className="px-6 py-3">Groups</td>
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
    </div>
  );
};

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