import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const Retraced: NextPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.push('/admin/retraced/projects');
  }, [router]);

  return <p>Redirecting...</p>;
};

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}

export default Retraced;
