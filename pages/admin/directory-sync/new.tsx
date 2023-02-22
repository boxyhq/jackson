import type { NextPage, GetStaticPropsContext } from 'next';
import React from 'react';
import CreateDirectory from '@components/dsync/CreateDirectory';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const DirectoryCreatePage: NextPage = () => {
  return <CreateDirectory />;
};

export const getStaticProps = async (context: GetStaticPropsContext) => {
  const { locale } = context;

  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
};

export default DirectoryCreatePage;
