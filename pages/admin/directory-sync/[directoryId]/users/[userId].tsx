import type { NextPage, GetServerSidePropsContext } from 'next';
import React from 'react';
import jackson from '@lib/jackson';
import DirectoryTab from '@components/dsync/DirectoryTab';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter/dist/cjs';
import { coy } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { inferSSRProps } from '@lib/inferSSRProps';

const UserInfo: NextPage<inferSSRProps<typeof getServerSideProps>> = ({ directory, user }) => {
  return (
    <div>
      <div className='mb-4 flex items-center justify-between'>
        <h2 className='font-bold text-primary dark:text-white md:text-2xl'>{directory.name}</h2>
      </div>
      <DirectoryTab directory={directory} activeTab='users' />
      <div className='w-3/4 rounded border text-sm'>
        <SyntaxHighlighter language='json' style={coy}>
          {JSON.stringify(user, null, 3)}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const { directoryId, userId } = context.query;
  const { directorySyncController } = await jackson();

  const { data: directory } = await directorySyncController.directories.get(directoryId as string);

  if (!directory) {
    return {
      notFound: true,
    };
  }

  const { data: user } = await directorySyncController.users
    .with(directory.tenant, directory.product)
    .get(userId as string);

  if (!user) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      directory,
      user,
    },
  };
};

export default UserInfo;
