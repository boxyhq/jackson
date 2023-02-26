import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { Trace } from '@boxyhq/saml-jackson';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialOceanic } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import useSWR from 'swr';
import { ApiSuccess, ApiError } from 'types';
import { fetcher } from '@lib/ui/utils';
import { errorToast } from '@components/Toaster';
import Loading from '@components/Loading';

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

  if (error) {
    errorToast(error.message);
    return null;
  }

  if (isLoading) {
    return <Loading />;
  }

  if (!data) return null;

  return (
    <div className='overflow-hidden bg-white shadow sm:rounded-lg'>
      <div className='px-4 py-5 sm:px-6'>
        <h3 className='text-base font-semibold leading-6 text-gray-900'>Trace details</h3>
        <p className='mt-1 max-w-2xl text-sm text-gray-500'>Personal details and application.</p>
      </div>
      <div className='border-t border-gray-200'>
        <dl>
          <div className='px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
            <dt className='text-sm font-medium text-gray-500'>Trace ID</dt>
            <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>{traceId}</dd>
          </div>
          <div className='px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
            <dt className='text-sm font-medium text-gray-500'>Timestamp</dt>
            <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>
              {new Date(data.data.timestamp).toLocaleString()}
            </dd>
          </div>
          <div className='px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
            <dt className='text-sm font-medium text-gray-500'>Error</dt>
            <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>{data.data.error}</dd>
          </div>
          <div className='px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
            <dt className='text-sm font-medium text-gray-500'>Raw response</dt>
            <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>
              <SyntaxHighlighter language='xml' style={materialOceanic}>
                {data?.data.context.samlResponse}
              </SyntaxHighlighter>
            </dd>
          </div>
        </dl>
      </div>
    </div>
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
