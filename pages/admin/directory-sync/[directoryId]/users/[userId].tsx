import type { NextPage, GetServerSideProps } from 'next';
import type { Directory, User } from '@lib/jackson';
import React from 'react';
import jackson from '@lib/jackson';
import DirectoryTab from '@components/dsync/DirectoryTab';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter/dist/cjs';
import { coy } from 'react-syntax-highlighter/dist/cjs/styles/prism';

const UserInfo: NextPage<{ directory: Directory; user: User }> = ({ directory, user }) => {
  return (
    <div>
      <div className='mb-4 flex items-center justify-between'>
        <h2 className='font-bold text-primary dark:text-white md:text-2xl'>{directory.name}</h2>
      </div>
      <DirectoryTab directory={directory} activeTab='users' />
      <div className='rounded border text-sm'>
        <SyntaxHighlighter language='json' style={coy}>
          {JSON.stringify(user, null, 3)}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { directoryId, userId } = context.query;
  const { directorySync } = await jackson();

  const directory = await directorySync.directories.get(directoryId as string);

  const user = await directorySync.users.with(directory.tenant, directory.product).get(userId as string);

  return {
    props: {
      directory,
      user,
    },
  };
};

export default UserInfo;
