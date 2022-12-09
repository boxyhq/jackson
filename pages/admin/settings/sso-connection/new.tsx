import type { GetServerSidePropsContext, NextPage } from 'next';
import Add from '@components/connection/Add';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const NewSSOConnection: NextPage = () => {
  return <Add showBackButton={false} titleText={'Create Admin Panel SSO Connection'} selfSSOSetup={true} />;
};

export async function getStaticProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default NewSSOConnection;
