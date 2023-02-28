import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import type { Trace } from '@boxyhq/saml-jackson';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialOceanic } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import useSWR from 'swr';
import { ApiSuccess, ApiError } from 'types';
import { fetcher } from '@lib/ui/utils';
import { errorToast } from '@components/Toaster';
import Loading from '@components/Loading';
import { useTranslation } from 'react-i18next';
import { LinkBack } from '@components/LinkBack';

const DescriptionListItem = ({ term, value }: { term: string; value: string | JSX.Element }) => (
  <div className='px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
    <dt className='text-sm font-medium text-gray-500'>{term}</dt>
    <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>{value}</dd>
  </div>
);

const SAMLTraceInspector: NextPage = () => {
  const { t } = useTranslation('common');

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
    <>
      <LinkBack onClick={() => router.back()} />
      <div className='mt-5 overflow-hidden bg-white shadow sm:rounded-lg'>
        <div className='px-4 py-5 sm:px-6'>
          <h3 className='text-base font-semibold leading-6 text-gray-900'>Trace details</h3>
          <p className='mt-1 flex max-w-2xl gap-6 text-sm text-gray-500'>
            <span>
              <span className='font-medium text-gray-500'>TraceID:</span>
              <span className='ml-2 font-bold text-gray-700'> {traceId}</span>
            </span>
            <span>
              <span className='font-medium text-gray-500'>{t('assertion_type')}:</span>
              <span className='ml-2 font-bold text-gray-700'>
                {data.data.context?.samlResponse ? 'Response' : 'Request'}
              </span>
            </span>
          </p>
        </div>
        <div className='border-t border-gray-200'>
          <dl>
            <DescriptionListItem term='Timestamp' value={new Date(data.data.timestamp).toLocaleString()} />
            <DescriptionListItem term='Error' value={data.data.error} />
            {typeof data.data.context.tenant === 'string' && (
              <DescriptionListItem term='Tenant' value={data.data.context.tenant} />
            )}
            {typeof data.data.context.product === 'string' && (
              <DescriptionListItem term='Product' value={data.data.context.product} />
            )}
            {typeof data.data.context.issuer === 'string' && (
              <DescriptionListItem term='Issuer' value={data.data.context.issuer} />
            )}

            <DescriptionListItem
              term='Raw response'
              value={
                <SyntaxHighlighter language='xml' style={materialOceanic}>
                  {data?.data.context.samlResponse}
                </SyntaxHighlighter>
              }
            />
            {typeof data.data.context.profile === 'string' && (
              <DescriptionListItem
                term='Profile'
                value={
                  <SyntaxHighlighter language='json' style={materialOceanic}>
                    {data?.data.context.profile}
                  </SyntaxHighlighter>
                }
              />
            )}
          </dl>
        </div>
      </div>
    </>
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
