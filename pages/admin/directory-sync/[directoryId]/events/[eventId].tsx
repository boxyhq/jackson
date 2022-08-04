import type { NextPage, GetServerSidePropsContext } from 'next';
import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter/dist/cjs';
import { coy } from 'react-syntax-highlighter/dist/cjs/styles/prism';

import jackson from '@lib/jackson';
import DirectoryTab from '@components/dsync/DirectoryTab';
import { inferSSRProps } from '@lib/inferSSRProps';

const EventInfo: NextPage<inferSSRProps<typeof getServerSideProps>> = ({ directory, event }) => {
  return (
    <>
      <h2 className='font-bold text-gray-700 md:text-xl'>{directory.name}</h2>
      <div className='w-full md:w-3/4'>
        <DirectoryTab directory={directory} activeTab='events' />
        <div className='my-3 rounded border text-sm'>
          <SyntaxHighlighter language='json' style={coy}>
            {JSON.stringify(event, null, 3)}
          </SyntaxHighlighter>
        </div>
      </div>
    </>
  );

  return (
    <div>
      <div className='mb-4 flex items-center justify-between'>
        <h2 className='font-bold text-primary dark:text-white md:text-2xl'>{directory.name}</h2>
      </div>
      <DirectoryTab directory={directory} activeTab='events' />
      <div className='w-3/4 rounded border text-sm'>
        <SyntaxHighlighter language='json' style={coy}>
          {JSON.stringify(event, null, 3)}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const { directoryId, eventId } = context.query;
  const { directorySyncController } = await jackson();

  const { data: directory } = await directorySyncController.directories.get(directoryId as string);

  if (!directory) {
    return {
      notFound: true,
    };
  }

  const event = await directorySyncController.webhookLogs
    .with(directory.tenant, directory.product)
    .get(eventId as string);

  if (!event) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      directory,
      event,
    },
  };
};

export default EventInfo;
