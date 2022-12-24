import type { GetServerSidePropsContext, NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import useSWR from 'swr';
import type { Directory } from '@boxyhq/saml-jackson';

import { fetcher } from '@lib/ui/utils';
import type { ApiError, ApiSuccess } from 'types';
import { errorToast } from '@components/Toaster';
import Loading from '@components/Loading';
import DirectoryList from '@components/dsync/DirectoryList';
import { pageLimit } from '@components/Pagination';
import usePaginate from '@lib/ui/hooks/usePaginate';

const Index: NextPage = () => {
  const { paginate, setPaginate } = usePaginate();

  const { data, error } = useSWR<ApiSuccess<Directory[]>, ApiError>(
    `/api/admin/directory-sync?offset=${paginate.offset}&limit=${pageLimit}`,
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

  return <DirectoryList directories={directories} paginate={paginate} setPaginate={setPaginate} />;
};

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const { locale }: GetServerSidePropsContext = context;

  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
};

export default Index;
