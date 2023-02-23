import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { Trace } from '@boxyhq/saml-jackson';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialOceanic } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import useSWR from 'swr';
import { ApiSuccess, ApiError } from 'types';
import { fetcher } from '@lib/ui/utils';

const SAMLTraceInspector: NextPage = () => {
  const router = useRouter();

  const { traceId } = router.query as { traceId: string };

  const { data, error, isLoading } = useSWR<ApiSuccess<Trace>, ApiError>(
    `/api/admin/saml-tracer/${traceId}`,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return (
    <SyntaxHighlighter language='xml' style={materialOceanic}>
      {data?.data.context.samlResponse}
    </SyntaxHighlighter>
  );
};

export default SAMLTraceInspector;


export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
