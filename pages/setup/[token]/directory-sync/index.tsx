import type { NextPage, GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import DirectoryList from '@components/dsync/DirectoryList';

const DirectoryIndexPage: NextPage = () => {
  const router = useRouter();

  const { token } = router.query as { token: string };

  return <DirectoryList setupLinkToken={token} />;
};

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const { locale } = context;

  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
};

export default DirectoryIndexPage;
