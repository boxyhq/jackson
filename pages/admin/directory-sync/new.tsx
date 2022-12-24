import type { NextPage, GetServerSideProps } from 'next';
import React from 'react';
import CreateDirectory from '@components/dsync/CreateDirectory';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const New: NextPage = () => {
  return <CreateDirectory />;
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? '', ['common'])),
    },
  };
};

export default New;
