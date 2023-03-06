import type { NextPage, GetServerSideProps } from 'next';
import React from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import CreateDirectory from '@components/dsync/CreateDirectory';

const DirectoryCreatePage: NextPage = () => {
  const router = useRouter();

  const { token } = router.query as { token: string };

  return <CreateDirectory setupLinkToken={token} />;
};

export const getServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
};

export default DirectoryCreatePage;
