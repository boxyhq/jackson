import type { NextPage, InferGetServerSidePropsType, GetServerSidePropsContext } from 'next';
import React from 'react';
import CreateDirectory from '@components/dsync/CreateDirectory';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { jacksonOptions } from '@lib/env';

const DirectoryCreatePage: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = (props) => {
  const { defaultWebhookEndpoint } = props;

  return <CreateDirectory defaultWebhookEndpoint={defaultWebhookEndpoint} />;
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
