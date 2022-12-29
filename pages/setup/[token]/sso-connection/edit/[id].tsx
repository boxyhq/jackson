import type { NextPage, GetServerSidePropsContext } from 'next';
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

  const { data, error } = useSWR(
    token ? (id ? `/api/setup/${token}/sso-connection/${id}` : null) : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  if (!data && !error) {
    return <Loading />;
  }

  if (error) {
    errorToast(error.message);
    return null;
  }

  const connection = data.data;

  return <EditConnection connection={connection} setupLinkToken={token} />;
};

export async function getStaticProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export async function getStaticPaths() {
  return {
    paths: [],
    fallback: 'blocking',
  };
}

export default ConnectionEditPage;
