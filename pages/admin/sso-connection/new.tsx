import type { GetServerSidePropsContext, NextPage } from 'next';
import Add from '@components/connection/Add';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const NewConnection: NextPage = () => {
  return <Add />;
};

export async function getStaticProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default NewConnection;
