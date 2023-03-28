import type { NextPage, InferGetServerSidePropsType, GetServerSidePropsContext } from 'next';
import React from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import CreateDirectory from '@components/dsync/CreateDirectory';
import { jacksonOptions } from '@lib/env';

const DirectoryCreatePage: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = (props) => {
  const { defaultWebhookEndpoint } = props;

  const router = useRouter();

  const { token } = router.query as { token: string };

  return <CreateDirectory setupLinkToken={token} defaultWebhookEndpoint={defaultWebhookEndpoint} />;
};

export const getServerSideProps = async ({ locale }: GetServerSidePropsContext) => {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
      defaultWebhookEndpoint: jacksonOptions.webhook?.endpoint,
    },
  };
};

export default DirectoryCreatePage;
