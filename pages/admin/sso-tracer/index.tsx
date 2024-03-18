import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { SSOTracers } from '@boxyhq/internal-ui';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const SSOTraceViewer: NextPage = () => {
  const router = useRouter();

  return (
    <SSOTracers
      urls={{ getTracers: '/api/admin/sso-tracer' }}
      onView={(trace) => router.push(`/admin/sso-tracer/${trace.traceId}/inspect`)}
    />
  );
};

export default SSOTraceViewer;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
