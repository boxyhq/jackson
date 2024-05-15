import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import jackson from '@lib/jackson';

export { default } from '@ee/identity-federation/pages/metadata';

export async function getServerSideProps({ locale }) {
  const { identityFederationController, checkLicense } = await jackson();

  const metadata = await identityFederationController.app.getMetadata();

  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
      metadata,
      hasValidLicense: await checkLicense(),
    },
  };
}
