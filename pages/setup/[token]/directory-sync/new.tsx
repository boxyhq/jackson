import type { NextPage, GetServerSideProps } from 'next';
import React from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import CreateDirectory from '@components/dsync/CreateDirectory';

const New: NextPage = () => {
  const router = useRouter();
  const { token } = router.query;
  return <CreateDirectory token={token as string} />;
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? '', ['common'])),
    },
  };
};

export default New;
