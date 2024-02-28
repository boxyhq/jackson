import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { SSOTracerInfo, LinkBack } from '@boxyhq/internal-ui';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const SSOTraceInspector: NextPage = () => {
  const router = useRouter();

  const { traceId } = router.query as { traceId: string };

  return (
    <div className='space-y-4'>
      <LinkBack href='/admin/sso-tracer' />
      <SSOTracerInfo urls={{ getTracer: `/api/admin/sso-tracer/${traceId}` }} />
    </div>
  );
};

export default SSOTraceInspector;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
