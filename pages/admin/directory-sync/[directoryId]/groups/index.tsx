import { NextPage, GetServerSideProps } from 'next';
import React from 'react';
import jackson from '@lib/jackson';

const GroupsList: NextPage = (props: any) => {
  const { directory, groups } = props;

  return (
    <div>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='font-bold text-primary dark:text-white md:text-2xl'>{directory.name}</h2>
      </div>
      <div className="flex flex-col space-y-3">
        Groups
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { directoryId } = context.query;
  const { directorySync } = await jackson();

  const directory = await directorySync.directories.get(directoryId as string);
  const groups = await directorySync.directories.listGroups({ directory: directory.id });

  return {
    props: {
      directory,
      groups
    },
  }
}

export default GroupsList;