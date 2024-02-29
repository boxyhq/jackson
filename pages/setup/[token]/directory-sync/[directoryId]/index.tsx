import React from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { DirectoryInfo, LinkBack } from '@boxyhq/internal-ui';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import { dsyncGoogleAuthURL } from '@lib/env';

const DirectoryDetailsPage: NextPage = () => {
  const router = useRouter();
  const { token, directoryId } = router.query as { token: string; directoryId: string };

  return (
    <div className='flex flex-col gap-4'>
      <div>
        <LinkBack href={`/setup/${token}/directory-sync`} />
      </div>
      <div>
        <DirectoryInfo
          urls={{
            getDirectory: `/api/setup/${token}/directory-sync/${directoryId}`,
            tabBase: '',
            googleAuth: dsyncGoogleAuthURL,
          }}
          hideTabs={true}
          displayGoogleAuthButton={true}
        />
      </div>
    </div>
  );
};

export const getServerSideProps = async (context) => {
  const { locale } = context;

  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
};

export default DirectoryDetailsPage;
