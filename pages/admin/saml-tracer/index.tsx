import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export { default } from 'ee/saml-tracer/pages/index';

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
