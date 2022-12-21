import type { NextPage, GetServerSideProps } from 'next';
import React from 'react';
import CreateDirectory from '@components/dsync/CreateDirectory';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import jackson from '@lib/jackson';

const New: NextPage<{ providers: any }> = ({ providers }) => {
  return <CreateDirectory providers={providers} />;
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
