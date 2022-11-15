import type { NextPage, GetServerSideProps } from 'next';
import React from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import jackson from '@lib/jackson';
import CreateDirectory from '@components/dsync/CreateDirectory';

const New: NextPage<{ providers: any }> = ({ providers }) => {
  const router = useRouter();
  const { token } = router.query;
  return <CreateDirectory providers={providers} token={token as string} />;
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  const { directorySyncController } = await jackson();

  return {
    props: {
      providers: directorySyncController.providers(),
      ...(await serverSideTranslations(locale ?? '', ['common'])),
    },
  };
};

export default New;
