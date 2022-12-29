import type { NextPage, GetServerSidePropsContext } from 'next';
import useSWR from 'swr';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { fetcher } from '@lib/ui/utils';
import Edit from '@components/connection/Edit';

const EditConnection: NextPage = () => {
  const router = useRouter();

  const { id, token } = router.query;
  const { data } = useSWR<any>(token ? `/api/setup/${token}` : null, fetcher, {
    revalidateOnFocus: false,
  });
  const setup = data?.data;

  const { data: connectionData, error } = useSWR(
    token ? (id ? `/api/setup/${token}/connections/${id}` : null) : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const connection = connectionData?.data;
  if (error) {
    return (
      <div className='rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700'>
        {error.info ? JSON.stringify(error.info) : error.status}
      </div>
    );
  }

  if (!token || !setup || !connection) {
    return null;
  }

  return <Edit connection={connection} setupToken={token as string} />;
};

export default EditConnection;

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
