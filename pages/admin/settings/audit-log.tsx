import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const AuditLog = () => {
  return <>Audit Log</>;
};

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}

export default AuditLog;
