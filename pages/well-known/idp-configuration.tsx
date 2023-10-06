import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import jackson from '@lib/jackson';

export { default } from 'ee/federated-saml/pages/metadata';

export async function getServerSideProps({ locale }) {
  const { samlFederatedController, checkLicense } = await jackson();

  const metadata = await samlFederatedController.app.getMetadata();

  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
      metadata,
      hasValidLicense: await checkLicense(),
    },
  };
}
