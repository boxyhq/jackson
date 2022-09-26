import type { NextPage, GetServerSidePropsContext } from 'next';
import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter/dist/cjs';
import { coy } from 'react-syntax-highlighter/dist/cjs/styles/prism';

import jackson from '@lib/jackson';
import DirectoryTab from '@components/dsync/DirectoryTab';
import { inferSSRProps } from '@lib/inferSSRProps';

const GroupInfo: NextPage<inferSSRProps<typeof getServerSideProps>> = ({ directory, group }) => {
  return (
    <>
      <h2 className='font-bold text-gray-700 md:text-xl'>{directory.name}</h2>
      <div className='w-full md:w-3/4'>
        <DirectoryTab directory={directory} activeTab='groups' />
        <div className='my-3 rounded border text-sm'>
          <SyntaxHighlighter language='json' style={coy}>
            {JSON.stringify(group, null, 3)}
          </SyntaxHighlighter>
        </div>
      </div>
    </>
  );
};

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const { directoryId, groupId } = context.query;
  const { directorySyncController } = await jackson();

  const { data: directory } = await directorySyncController.directories.get(directoryId as string);

  if (!directory) {
    return {
      notFound: true,
    };
  }

  const { data: group } = await directorySyncController.groups
    .with(directory.tenant, directory.product)
    .get(groupId as string);

  if (!group) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      directory,
      group,
    },
  };
};

export default GroupInfo;
