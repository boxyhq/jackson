import { WellKnownURLs } from '@boxyhq/internal-ui';
import type { GetServerSidePropsContext, NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const Dashboard: NextPage = () => {
  return <WellKnownURLs />;
};

export async function getStaticProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default Dashboard;
