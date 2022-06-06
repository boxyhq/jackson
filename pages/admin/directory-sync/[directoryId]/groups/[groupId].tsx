import { NextPage, GetServerSideProps } from 'next';
import React from 'react';
import jackson from '@lib/jackson';
import DirectoryTab from '@components/dsync/DirectoryTab';
import PrettyPrintJson from '@components/PrettyPrintJson';

const GroupInfo: NextPage = (props: any) => {
  const { directory, group } = props;

  return (
    <div>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='font-bold text-primary dark:text-white md:text-2xl'>{directory.name}</h2>
      </div>
      <DirectoryTab directory={directory} activeTab="groups" />
      <div className='rounded border'>
        <PrettyPrintJson data={group} /> 
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { directoryId, groupId } = context.query;
  const { directorySync } = await jackson();

  const directory = await directorySync.directories.get(directoryId as string);

  const group = await directorySync.groups
    .with(directory.tenant, directory.product)
    .get(groupId as string);

  return {
    props: {
      directory,
      group,
    },
  }
}

export default GroupInfo;