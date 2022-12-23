import type { NextPage } from 'next';
import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter/dist/cjs';
import { coy } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import useSWR from 'swr';
import type { Directory, WebhookEventLog } from '@boxyhq/saml-jackson';
import { useRouter } from 'next/router';

import DirectoryTab from '@components/dsync/DirectoryTab';
import { ApiError, ApiSuccess } from 'types';
import { fetcher } from '@lib/ui/utils';
import { errorToast } from '@components/Toaster';
import Loading from '@components/Loading';

const EventInfo: NextPage = () => {
  const router = useRouter();

  const { directoryId, eventId } = router.query as { directoryId: string; eventId: string };

  const { data: directoryData, error: directoryError } = useSWR<ApiSuccess<Directory>, ApiError>(
    `/api/admin/directory-sync/${directoryId}`,
    fetcher
  );

  const { data: eventsData, error: eventsError } = useSWR<ApiSuccess<WebhookEventLog>, ApiError>(
    `/api/admin/directory-sync/${directoryId}/events/${eventId}`,
    fetcher
  );

  if (!directoryData || !eventsData) {
    return <Loading />;
  }

  const error = directoryError || eventsError;

  if (error) {
    errorToast(error.message);
    return null;
  }

  const directory = directoryData.data;
  const event = eventsData.data;

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
};

export default EventInfo;
