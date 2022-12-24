import type { NextPage, GetServerSideProps } from 'next';
import React from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import CreateDirectory from '@components/dsync/CreateDirectory';

const New: NextPage = () => {
  const router = useRouter();

  const { token } = router.query as { token: string };

  return <CreateDirectory token={token} />;
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? '', ['common'])),
    },
  };
};

export default New;
