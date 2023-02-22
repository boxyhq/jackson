import type { NextPage, GetServerSidePropsContext } from 'next';
import CreateConnection from '@components/connection/CreateConnection';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import useIdpEntityID from '@lib/ui/hooks/useIdpEntityID';

const ConnectionCreatePage: NextPage = () => {
  const router = useRouter();

  const { token } = router.query as { token: string };

  const { idpEntityID } = useIdpEntityID(token);

  return <CreateConnection setupLinkToken={token} idpEntityID={idpEntityID} />;
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

export default ConnectionCreatePage;
