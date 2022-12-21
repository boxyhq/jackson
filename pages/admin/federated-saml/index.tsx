import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export { default } from 'ee/federated-saml/pages/index';

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
