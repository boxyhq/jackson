import React from 'react';
import { useRouter } from 'next/router';
import type { NextPage, GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { LinkBack } from '@components/LinkBack';
import { DirectoryUsers } from '@boxyhq/internal-ui';

const UsersList: NextPage = () => {
  const router = useRouter();

  const { directoryId } = router.query as {
    directoryId: string;
  };

  return (
    <>
      <LinkBack href='/admin/directory-sync' />
      <DirectoryUsers
        urls={{
          getUsers: `/api/admin/directory-sync/${directoryId}/users`,
          getDirectory: `/api/admin/directory-sync/${directoryId}`,
          tabBase: `/admin/directory-sync/${directoryId}`,
        }}
        onView={(user) => router.push(`/admin/directory-sync/${directoryId}/users/${user.id}`)}
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

export default UsersList;
