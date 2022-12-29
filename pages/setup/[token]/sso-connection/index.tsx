import type { GetServerSidePropsContext, NextPage, GetStaticPaths } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ConnectionList from '@components/connection/ConnectionList';
import { useRouter } from 'next/router';
import { fetcher } from '@lib/ui/utils';
import useSWR from 'swr';
import { pageLimit } from '@components/Pagination';
import usePaginate from '@lib/ui/hooks/usePaginate';
import useIdpEntityID from '@lib/ui/hooks/useIdpEntityID';
import Loading from '@components/Loading';
import { errorToast } from '@components/Toaster';
import type { ApiError, ApiSuccess } from 'types';
import type { OIDCSSORecord, SAMLSSORecord } from '@boxyhq/saml-jackson';

const ConnectionsIndexPage: NextPage = () => {
  const router = useRouter();
  const { paginate, setPaginate } = usePaginate();

  const { token } = router.query as { token: string };

  const { idpEntityID } = useIdpEntityID(token);

  const { data, error } = useSWR<ApiSuccess<(SAMLSSORecord | OIDCSSORecord)[]>, ApiError>(
    [`/api/setup/${token}/connections`, `?pageOffset=${paginate.offset}&pageLimit=${pageLimit}`],
    fetcher,
    { revalidateOnFocus: false }
  );

  if (!data) {
    return <Loading />;
  }

  if (error) {
    errorToast(error.message);
    return null;
  }

  const connections = data.data || [];

  return (
    <ConnectionList
      setupToken={token}
      paginate={paginate}
      setPaginate={setPaginate}
      connections={connections}
      idpEntityID={idpEntityID}
    />
  );
};

export async function getStaticProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export const getStaticPaths: GetStaticPaths<{ slug: string }> = async () => {
  return {
    paths: [],
    fallback: 'blocking',
  };
};

export default ConnectionsIndexPage;
