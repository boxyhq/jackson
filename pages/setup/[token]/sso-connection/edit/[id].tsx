import type { NextPage } from 'next';
import useSWR from 'swr';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { fetcher } from '@lib/ui/utils';
import EditConnection from '@components/connection/EditConnection';
import Loading from '@components/Loading';
import { errorToast } from '@components/Toaster';

const ConnectionEditPage: NextPage = () => {
  const router = useRouter();

  const { id, token } = router.query as { id: string; token: string };

  const { data, error, isLoading } = useSWR(
    token ? (id ? `/api/setup/${token}/sso-connection/${id}` : null) : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    errorToast(error.message);
    return null;
  }

  const connection = data.data;

  return <EditConnection connection={connection} setupLinkToken={token} />;
};

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}

export default ConnectionEditPage;
