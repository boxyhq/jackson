import type { NextPage, GetServerSidePropsContext } from 'next';
import React from 'react';
import { useRouter } from 'next/router';
import DirectoryInfo from '@components/dsync/DirectoryInfo';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import useDirectory from '@lib/ui/hooks/useDirectory';
import Loading from '@components/Loading';
import { errorToast } from '@components/Toaster';

const DirectoryDetailsPage: NextPage = () => {
  const router = useRouter();

  const { token, directoryId } = router.query as { token: string; directoryId: string };

  const { directory, isLoading, error } = useDirectory(directoryId, token);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    errorToast(error.message);
    return null;
  }

  if (!directory) {
    return null;
  }

  return <DirectoryInfo directory={directory} token={token} />;
};

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const { locale } = context;

  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
};

export default DirectoryDetailsPage;
