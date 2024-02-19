import React from 'react';
import { useRouter } from 'next/router';
import type { NextPage, GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { DirectoryWebhookLogInfo, LinkBack } from '@boxyhq/internal-ui';

const EventInfo: NextPage = () => {
  const router = useRouter();

  const { directoryId, eventId } = router.query as {
    directoryId: string;
    eventId: string;
  };

  return (
    <>
      <LinkBack href={`/admin/directory-sync/${directoryId}/events`} />
      <DirectoryWebhookLogInfo
        urls={{
          get: `/api/admin/directory-sync/${directoryId}/events/${eventId}`,
          getDirectory: `/api/admin/directory-sync/${directoryId}`,
        }}
      />
    </>
  );
};

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const { locale } = context;

  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
};

export default EventInfo;
