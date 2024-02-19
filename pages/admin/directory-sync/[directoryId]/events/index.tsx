import type { NextPage, GetServerSidePropsContext } from 'next';
import React from 'react';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { errorToast } from '@components/Toaster';
import Loading from '@components/Loading';
import useDirectory from '@lib/ui/hooks/useDirectory';
import { LinkBack } from '@components/LinkBack';
import { DirectoryWebhookLogs } from '@boxyhq/internal-ui';

const Events: NextPage = () => {
  const router = useRouter();

  const { directoryId } = router.query as { directoryId: string };

  const { directory, isLoading, error } = useDirectory(directoryId);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    errorToast(error.message);
    return null;
  }

  if (!directory) {
    return null;
  }

  // const clearEvents = async () => {
  //   setLoading(true);

  //   await fetch(`/api/admin/directory-sync/${directoryId}/events`, {
  //     method: 'DELETE',
  //   });

  //   setLoading(false);

  //   router.reload();
  // };

  return (
    <>
      <LinkBack href='/admin/directory-sync' />
      <DirectoryWebhookLogs
        urls={{
          get: `/api/admin/directory-sync/${directoryId}/events`,
          getDirectory: `/api/admin/directory-sync/${directoryId}`,
        }}
        onEdit={(event) => router.push(`/admin/directory-sync/${directoryId}/events/${event.id}`)}
        router={router}
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

export default Events;
