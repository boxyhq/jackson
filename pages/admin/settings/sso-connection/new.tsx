import type { GetServerSidePropsContext, NextPage } from 'next';
import CreateConnection from '@components/connection/CreateConnection';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { AdminSSODefaults } from '@components/connection/utils';
import { jacksonOptions } from '@lib/env';

type Props = {
  adminSSODefaults: AdminSSODefaults;
};

const NewSSOConnection: NextPage<Props> = ({ adminSSODefaults }) => {
  return <CreateConnection isSettingsView adminSSODefaults={adminSSODefaults} />;
};

export async function getStaticProps({ locale }: GetServerSidePropsContext) {
  const { externalUrl } = jacksonOptions;
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
      adminSSODefaults: {
        tenant: process.env.ADMIN_PORTAL_TENANT,
        product: process.env.ADMIN_PORTAL_PRODUCT,
        redirectUrl: externalUrl,
        defaultRedirectUrl: `${externalUrl}/api/auth/callback/boxyhq-saml`,
      },
    },
  };
}

export default NewSSOConnection;
