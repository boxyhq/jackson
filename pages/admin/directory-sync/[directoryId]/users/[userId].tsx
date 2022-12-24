import type { NextPage } from 'next';
import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter/dist/cjs';
import { coy } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import type { Directory, User } from '@boxyhq/saml-jackson';

import DirectoryTab from '@components/dsync/DirectoryTab';
import { ApiError, ApiSuccess } from 'types';
import { fetcher } from '@lib/ui/utils';
import { errorToast } from '@components/Toaster';
import Loading from '@components/Loading';

const UserInfo: NextPage = () => {
  const router = useRouter();

  const { directoryId, userId } = router.query as { directoryId: string; userId: string };

  // TODO: Move this to a custom hook to avoid code duplication
  const { data: directoryData, error: directoryError } = useSWR<ApiSuccess<Directory>, ApiError>(
    `/api/admin/directory-sync/${directoryId}`,
    fetcher
  );

  const { data: userData, error: userError } = useSWR<ApiSuccess<User>, ApiError>(
    `/api/admin/directory-sync/${directoryId}/users/${userId}`,
    fetcher
  );

  if (!directoryData || !userData) {
    return <Loading />;
  }

  const error = directoryError || userError;

  if (error) {
    errorToast(error.message);
    return null;
  }

  const directory = directoryData.data;
  const user = userData.data;

  return (
    <>
      <h2 className='font-bold text-gray-700 md:text-xl'>{directory.name}</h2>
      <div className='w-full md:w-3/4'>
        <DirectoryTab directory={directory} activeTab='users' />
        <div className='my-3 rounded border text-sm'>
          <SyntaxHighlighter language='json' style={coy}>
            {JSON.stringify(user, null, 3)}
          </SyntaxHighlighter>
        </div>
      </div>
    </>
  );
};

export default UserInfo;
