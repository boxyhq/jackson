import type { GetServerSidePropsContext, NextPage } from 'next';
import ConnectionList from '@components/connection/ConnectionList';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import useSWR from 'swr';
import { fetcher } from '@lib/ui/utils';
import { pageLimit } from '@components/Pagination';
import type { ApiError, ApiSuccess } from 'types';
import { errorToast } from '@components/Toaster';
import Loading from '@components/Loading';
import usePaginate from '@lib/ui/hooks/usePaginate';
import type { SAMLSSORecord, OIDCSSORecord } from '@boxyhq/saml-jackson';

const Connections: NextPage = () => {
  const { paginate, setPaginate } = usePaginate();

  const { data, error } = useSWR<ApiSuccess<(SAMLSSORecord | OIDCSSORecord)[]>, ApiError>(
    [`/api/admin/connections`, `?pageOffset=${paginate.offset}&pageLimit=${pageLimit}`],
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

  return <ConnectionList connections={connections} paginate={paginate} setPaginate={setPaginate} />;
};

export async function getStaticProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default Connections;
