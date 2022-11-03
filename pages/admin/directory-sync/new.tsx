import type { NextPage, GetServerSideProps } from 'next';
import React from 'react';
import AddEdit from '@components/dsync/AddEdit';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import jackson from '@lib/jackson';

const New: NextPage<{ providers: any }> = ({ providers }) => {
  return <AddEdit providers={providers} />;
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
