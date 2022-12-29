import type { NextPage, GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import DirectoryList from '@components/dsync/DirectoryList';
import usePaginate from '@lib/ui/hooks/usePaginate';
import { fetcher } from '@lib/ui/utils';
import type { ApiError, ApiSuccess } from 'types';
import useSWR from 'swr';
import type { Directory } from '@boxyhq/saml-jackson';
import { pageLimit } from '@components/Pagination';
import { errorToast } from '@components/Toaster';
import Loading from '@components/Loading';

const DirectoryIndexPage: NextPage = () => {
  const router = useRouter();
  const { paginate, setPaginate } = usePaginate();

  const { token } = router.query as { token: string };

  const { data, error } = useSWR<ApiSuccess<Directory[]>, ApiError>(
    `/api/setup/${token}/directory-sync?offset=${paginate.offset}&limit=${pageLimit}`,
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
    <DirectoryList directories={directories} token={token} paginate={paginate} setPaginate={setPaginate} />
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

// export const getServerSideProps = async (context: GetServerSidePropsContext) => {
//   const { offset = 0, token } = context.query;
//   const { directorySyncController, setupLinkController } = await jackson();
//   const { locale }: GetServerSidePropsContext = context;
//   let directories;
//   if (!token) {
//     directories = [];
//   } else {
//     const { data: setup, error: err } = await setupLinkController.getByToken(token);
//     if (err) {
//       directories = [];
//     } else if (!setup) {
//       directories = [];
//     } else if (setup?.validTill < +new Date()) {
//       directories = [];
//     } else {
//       const { data } = await directorySyncController.directories.getByTenantAndProduct(
//         setup.tenant,
//         setup.product
//       );
//       directories = data ? [data] : [];
//     }
//   }
//   const pageOffset = parseInt(offset as string);
//   const pageLimit = 25;
//   return {
//     props: {
//       providers: directorySyncController.providers(),
//       directories,
//       pageOffset,
//       pageLimit,
//       ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
//     },
//   };
// };

export default DirectoryIndexPage;
