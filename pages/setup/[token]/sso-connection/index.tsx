import type { GetServerSidePropsContext, NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import ConnectionList from '@components/connection/ConnectionList';
import { useRouter } from 'next/router';
import useIdpEntityID from '@lib/ui/hooks/useIdpEntityID';

const ConnectionsIndexPage: NextPage = () => {
  const router = useRouter();

  const { token } = router.query as { token: string };

  const { idpEntityID } = useIdpEntityID(token);

  return <ConnectionList setupLinkToken={token} idpEntityID={idpEntityID} />;
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

export default ConnectionsIndexPage;
