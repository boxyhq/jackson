import type { GetServerSidePropsContext, NextPage, GetStaticPaths } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ConnectionList from '@components/connection/ConnectionList';
import { useRouter } from 'next/router';
import { fetcher } from '@lib/ui/utils';
import { useState } from 'react';
import useSWR from 'swr';

const Connections: NextPage = () => {
  const router = useRouter();
  const { token } = router.query;
  const [paginate, setPaginate] = useState({ pageOffset: 0, pageLimit: 20, page: 0 });
  const {
    data: connections,
    error,
    isValidating,
  } = useSWR<any>(
    [`/api/setup/${token}/connections`, `?pageOffset=${paginate.pageOffset}&pageLimit=${paginate.pageLimit}`],
    fetcher,
    { revalidateOnFocus: false }
  );
  const { data: boxyhqEntityID } = useSWR<any>(
    token ? `/api/setup/${token}/connections/entityID` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  return token && connections && !error && !isValidating ? (
    <ConnectionList
      setupToken={token as string}
      paginate={paginate}
      setPaginate={setPaginate}
      connections={connections}
      boxyhqEntityID={boxyhqEntityID}
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
