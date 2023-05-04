import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export { default } from 'ee/audit-log/pages/index';

export async function getServerSideProps({ locale, req }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
