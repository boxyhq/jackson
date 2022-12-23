import type { InferGetServerSidePropsType, GetServerSidePropsContext } from 'next';
import jackson from '@lib/jackson';
import DirectoryList from '@components/dsync/DirectoryList';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import useSWR from 'swr';
import { fetcher } from '@lib/ui/utils';
import type { Directory } from '@boxyhq/saml-jackson';
import { ApiError, ApiSuccess } from 'types';
import { errorToast } from '@components/Toaster';
import { useRouter } from 'next/router';
import Loading from '@components/Loading';

const Index = ({ providers }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter();

  const { offset } = router.query as { offset: string };

  const pageOffset = parseInt(offset) || 0;
  const pageLimit = 25; // Make this configurable

  const { data, error } = useSWR<ApiSuccess<Directory[]>, ApiError>(
    `/api/admin/directory-sync?offset=${pageOffset}&limit=${pageLimit}`,
    fetcher
  );

  if (!data) {
    return <Loading />;
  }

  if (error) {
    errorToast(error.message);
    return null;
  }

  const directories = data.data || [];

  return (
    <DirectoryList
      directories={directories}
      pageOffset={pageOffset}
      pageLimit={pageLimit}
      providers={providers}
    />
  );
};

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const { directorySyncController } = await jackson();

  const { locale }: GetServerSidePropsContext = context;

  return {
    props: {
      providers: directorySyncController.providers(),
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
};

export default Index;
