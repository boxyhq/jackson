import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export { default } from 'ee/branding/pages/index';

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
