import type { GetServerSidePropsContext, NextPage, GetStaticPaths } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ConnectionList from '@components/connection/ConnectionList';
import { useRouter } from 'next/router';
import { fetcher } from '@lib/ui/utils';
import useSWR from 'swr';
import { pageLimit } from '@components/Pagination';
import usePaginate from '@lib/ui/hooks/usePaginate';

const Connections: NextPage = () => {
  const router = useRouter();
  const { paginate, setPaginate } = usePaginate();

  const { token } = router.query as { token: string };

  const { data, error, isValidating } = useSWR(
    [`/api/setup/${token}/connections`, `?pageOffset=${paginate.offset}&pageLimit=${pageLimit}`],
    fetcher,
    { revalidateOnFocus: false }
  );

  const connections = data?.data;
  const { data: idpEntityIDData } = useSWR(
    token ? `/api/setup/${token}/connections/idp-entityid` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const idpEntityID = idpEntityIDData?.data;
  return token && connections && !error && !isValidating ? (
    <ConnectionList
      setupToken={token}
      paginate={paginate}
      setPaginate={setPaginate}
      connections={connections}
      idpEntityID={idpEntityID}
    />
  ) : null;
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
    paths: [], //indicates that no page needs be created at build time
    fallback: 'blocking', //indicates the type of fallback
  };
};

export default Connections;
