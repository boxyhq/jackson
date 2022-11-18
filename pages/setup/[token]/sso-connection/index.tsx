import type { GetServerSidePropsContext, NextPage, GetStaticPaths } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ConnectionList from '@components/connection/ConnectionList';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';

const Connections: NextPage = () => {
  const router = useRouter();
  const { token } = router.query;
  const { t } = useTranslation('common');
  return token ? <ConnectionList setupToken={token as string} /> : null;
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
