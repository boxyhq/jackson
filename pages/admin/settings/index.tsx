import type { GetServerSidePropsContext, NextPage } from 'next';
import Add from '@components/connection/Add';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const Settings: NextPage = () => {
  return (
    <Add
      showBackButton={false}
      titleText={'Create Admin Panel SSO Connection'}
      readonlyTenant={process.env.NEXT_PUBLIC_ADMIN_PORTAL_TENANT}
      readonlyProduct={process.env.NEXT_PUBLIC_ADMIN_PORTAL_PRODUCT}
    />
  );
};

export async function getStaticProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default Settings;
