import type { GetServerSidePropsContext, NextPage } from 'next';
import useSWR from 'swr';
import { useRouter } from 'next/router';

import { fetcher } from '@lib/ui/utils';
import Edit from '@components/connection/Edit';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { ApiError, ApiSuccess } from 'types';
import { Loader } from '@components/Loader';
import { OIDCSSORecord, SAMLSSORecord } from '@boxyhq/saml-jackson';
import toast from 'react-hot-toast';

const EditConnection: NextPage = () => {
  const router = useRouter();

  const { id } = router.query as { id: string };

  const { data, error } = useSWR<ApiSuccess<SAMLSSORecord | OIDCSSORecord>, ApiError>(
    id ? `/api/admin/connections/${id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  if (!data && !error) {
    return <Loader />;
  }

  if (error) {
    toast.error(error.message);
    return null;
  }

  return <Edit connection={data?.data} />;
};

export async function getServerSideProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default EditConnection;
