import type { GetServerSidePropsContext, NextPage } from 'next';
import AddEdit from '@components/connection/AddEdit';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const NewConnection: NextPage = () => {
  return <AddEdit />;
};

export async function getStaticProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default NewConnection;
