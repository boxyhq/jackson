import type { NextPage } from 'next';
import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter/dist/cjs';
import { coy } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import type { Directory, Group } from '@boxyhq/saml-jackson';

import DirectoryTab from '@components/dsync/DirectoryTab';
import EmptyState from '@components/EmptyState';
import Paginate from '@components/Paginate';
import { ApiError, ApiSuccess } from 'types';
import { fetcher } from '@lib/ui/utils';
import { errorToast } from '@components/Toaster';
import Loading from '@components/Loading';

const GroupInfo: NextPage = () => {
  const router = useRouter();

  const { directoryId, groupId } = router.query as { directoryId: string; groupId: string };

  // TODO: Move this to a custom hook to avoid code duplication
  const { data: directoryData, error: directoryError } = useSWR<ApiSuccess<Directory>, ApiError>(
    `/api/admin/directory-sync/${directoryId}`,
    fetcher
  );

  const { data: groupData, error: groupError } = useSWR<ApiSuccess<Group>, ApiError>(
    `/api/admin/directory-sync/${directoryId}/groups/${groupId}`,
    fetcher
  );

  if (!directoryData || !groupData) {
    return <Loading />;
  }

  const error = directoryError || groupError;

  if (error) {
    errorToast(error.message);
    return null;
  }

  const directory = directoryData.data;
  const group = groupData.data;

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

export default GroupInfo;
