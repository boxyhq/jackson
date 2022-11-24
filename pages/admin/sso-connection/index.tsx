import type { GetServerSidePropsContext, NextPage } from 'next';
import ConnectionList from '@components/connection/ConnectionList';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import useSWR from 'swr';
import { fetcher } from '@lib/ui/utils';
import { useState } from 'react';

const Connections: NextPage = () => {
  const [paginate, setPaginate] = useState({ pageOffset: 0, pageLimit: 20, page: 0 });
  const { data: connections } = useSWR<any>(
    ['/api/admin/connections', `?pageOffset=${paginate.pageOffset}&pageLimit=${paginate.pageLimit}`],
    fetcher,
    { revalidateOnFocus: false }
  );
  return <ConnectionList paginate={paginate} setPaginate={setPaginate} connections={connections} />;
};

export async function getStaticProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default Connections;
