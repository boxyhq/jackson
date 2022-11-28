import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export { default } from 'ee/federated-saml/pages/edit';

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
