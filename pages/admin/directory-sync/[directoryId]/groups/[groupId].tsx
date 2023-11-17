import type { NextPage, GetServerSidePropsContext } from 'next';
import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter/dist/cjs';
import { materialOceanic } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import type { Group } from '@npm/src/index';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import DirectoryTab from '@components/dsync/DirectoryTab';
import type { ApiError, ApiSuccess } from 'types';
import { fetcher } from '@lib/ui/utils';
import { errorToast } from '@components/Toaster';
import Loading from '@components/Loading';
import useDirectory from '@lib/ui/hooks/useDirectory';
import { LinkBack } from '@components/LinkBack';

const GroupInfo: NextPage = () => {
  const router = useRouter();

  const { directoryId, groupId } = router.query as { directoryId: string; groupId: string };

  const { directory, isLoading: isDirectoryLoading, error: directoryError } = useDirectory(directoryId);

  const {
    data: groupData,
    error: groupError,
    isLoading,
  } = useSWR<ApiSuccess<Group>, ApiError>(
    `/api/admin/directory-sync/${directoryId}/groups/${groupId}`,
    fetcher
  );

  if (isDirectoryLoading || isLoading) {
    return <Loading />;
  }

  const error = directoryError || groupError;

  if (error) {
    errorToast(error.message);
    return null;
  }

  if (!directory) {
    return null;
  }

  const group = groupData?.data;

  return (
    <>
      <LinkBack href={`/admin/directory-sync/${directory.id}/groups`} />
      <h2 className='mt-5 font-bold text-gray-700 md:text-xl'>{directory.name}</h2>
      <div className='w-full md:w-3/4'>
        <DirectoryTab directory={directory} activeTab='groups' />
        <div className='my-3 rounded border text-sm'>
          <SyntaxHighlighter language='json' style={materialOceanic}>
            {JSON.stringify(group, null, 3)}
          </SyntaxHighlighter>
        </div>
      </div>
    </>
  );
};

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const { locale } = context;

  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
};

export default GroupInfo;
