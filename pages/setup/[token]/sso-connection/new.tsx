import type { NextPage, GetServerSidePropsContext, GetStaticPaths } from 'next';
import Add from '@components/connection/Add';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import useIdpEntityID from '@lib/ui/hooks/useIdpEntityID';

const CreateConnectionPage: NextPage = () => {
  const router = useRouter();

  const { token } = router.query as { token: string };

  const { idpEntityID } = useIdpEntityID(token);

  return <Add setupToken={token} idpEntityID={idpEntityID} />;
};

export async function getStaticProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: 'blocking',
  };
};

export default CreateConnectionPage;
