import { NextPage, GetServerSideProps } from 'next';
import React from 'react';
import jackson from '@lib/jackson';
import DirectoryTab from '@components/dsync/DirectoryTab';
import PrettyPrintJson from '@components/PrettyPrintJson';

const UserInfo: NextPage = (props: any) => {
  const { directory, user } = props;

  return (
    <div>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='font-bold text-primary dark:text-white md:text-2xl'>{directory.name}</h2>
      </div>
      <DirectoryTab directory={directory} activeTab="users" />
      <div className='rounded border'>
        <PrettyPrintJson data={user} /> 
      </div>
    </div>
  );
};

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