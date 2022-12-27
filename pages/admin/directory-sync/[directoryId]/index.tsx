import type { NextPage, GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';

import DirectoryInfo from '@components/dsync/DirectoryInfo';
import { errorToast } from '@components/Toaster';
import Loading from '@components/Loading';
import useDirectory from '@lib/ui/hooks/useDirectory';

const Info: NextPage = () => {
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

  return <DirectoryInfo directory={directory} />;
};

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const { locale }: GetServerSidePropsContext = context;

  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
};

export default Info;
