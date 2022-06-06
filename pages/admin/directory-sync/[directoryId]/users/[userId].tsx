import { NextPage, GetServerSideProps } from 'next';
import React from 'react';
import jackson from '@lib/jackson';
import { Badge } from '@supabase/ui'
import DirectoryTab from '@components/dsync/DirectoryTab';
import { EyeIcon } from '@heroicons/react/outline';
import Link from 'next/link';

const UserInfo: NextPage = (props: any) => {
  const { directory, user } = props;

  console.log(user)

  return (
    <div>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='font-bold text-primary dark:text-white md:text-2xl'>{directory.name}</h2>
      </div>
      <DirectoryTab directory={directory} activeTab="users" />
      <div className='rounded border'>
        <PrettyPrintJson data={user.raw} /> 
      </div>
    </div>
  );
};

const PrettyPrintJson = (props: any) => {
  const { data } = props;

  return (
    <div className='p-4 bg-slate-100 text-sm'>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { directoryId, userId } = context.query;
  const { directorySync } = await jackson();

  const directory = await directorySync.directories.get(directoryId as string);

  const user = await directorySync.users
    .with(directory.tenant, directory.product)
    .get(userId as string);

  return {
    props: {
      directory,
      user,
    },
  }
}

export default UserInfo;