import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import type { SSOTrace } from '@boxyhq/saml-jackson';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialOceanic } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import useSWR from 'swr';
import { ApiSuccess, ApiError } from 'types';
import { fetcher } from '@lib/ui/utils';
import { errorToast } from '@components/Toaster';
import Loading from '@components/Loading';
import { useTranslation } from 'next-i18next';
import { LinkBack } from '@components/LinkBack';
import { Badge } from 'react-daisyui';
import { CopyToClipboardButton } from '@components/ClipboardButton';

const DescriptionListItem = ({ term, value }: { term: string; value: string | JSX.Element }) => (
  <div className='px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
    <dt className='text-sm font-medium text-gray-500'>{term}</dt>
    <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>{value}</dd>
  </div>
);

const SSOTraceInspector: NextPage = () => {
  const { t } = useTranslation('common');

  const router = useRouter();

  const { traceId } = router.query as { traceId: string };

  const { data, error, isLoading } = useSWR<ApiSuccess<SSOTrace>, ApiError>(
    `/api/admin/sso-tracer/${traceId}`,
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

  const trace = data.data;
  const assertionType = trace.context.samlResponse ? 'Response' : trace.context.samlRequest ? 'Request' : '-';

  return (
    <>
      <LinkBack onClick={() => router.back()} />
      <div className='mt-5 overflow-hidden bg-white shadow sm:rounded-lg'>
        <div className='px-4 py-5 sm:px-6'>
          <h3 className='text-base font-semibold leading-6 text-gray-900'>{t('trace_details')}</h3>
          <p className='mt-1 flex max-w-2xl gap-6 text-sm text-gray-500'>
            <span className='whitespace-nowrap'>
              <span className='font-medium text-gray-500'>{t('trace_id')}</span>
              <span className='ml-2 font-bold text-gray-700'> {traceId}</span>
            </span>
            <span className='whitespace-nowrap'>
              <span className='font-medium text-gray-500'>{t('assertion_type')}:</span>
              <span className='ml-2 font-bold text-gray-700'>{assertionType}</span>
            </span>
            <span className='whitespace-nowrap'>
              <span className='font-medium text-gray-500'>{t('sp_protocol')}:</span>
              <Badge
                color='primary'
                size='md'
                className='ml-2 font-mono uppercase text-white'
                aria-label='SP Protocol'>
                {trace.context.requestedOIDCFlow
                  ? 'OIDC'
                  : trace.context.isSAMLFederated
                    ? t('saml_federation')
                    : trace.context.isIdPFlow
                      ? t('idp_login')
                      : 'OAuth 2.0'}
              </Badge>
            </span>
          </p>
        </div>
        <div className='border-t border-gray-200'>
          <dl>
            {typeof trace.timestamp === 'number' && (
              <DescriptionListItem term={t('timestamp')} value={new Date(trace.timestamp).toLocaleString()} />
            )}
            <DescriptionListItem term={t('error')} value={trace.error} />
            {trace.context.tenant && <DescriptionListItem term={t('tenant')} value={trace.context.tenant} />}
            {trace.context.product && (
              <DescriptionListItem term={t('product')} value={trace.context.product} />
            )}
            {trace.context.relayState && (
              <DescriptionListItem term={t('relay_state')} value={trace.context.relayState} />
            )}
            {trace.context.redirectUri && (
              <DescriptionListItem
                term={t(trace.context.isIDPFlow ? 'default_redirect_url' : 'redirect_uri')}
                value={trace.context.redirectUri}
              />
            )}
            {trace.context.clientID && (
              <DescriptionListItem term={t('sso_connection_client_id')} value={trace.context.clientID} />
            )}
            {trace.context.issuer && <DescriptionListItem term={t('issuer')} value={trace.context.issuer} />}
            {trace.context.acsUrl && <DescriptionListItem term={t('acs_url')} value={trace.context.acsUrl} />}
            {trace.context.entityId && (
              <DescriptionListItem term={t('trace_entity_id')} value={trace.context.entityId} />
            )}
            {trace.context.providerName && (
              <DescriptionListItem term={t('provider')} value={trace.context.providerName} />
            )}
            {assertionType === 'Response' && trace.context.samlResponse && (
              <DescriptionListItem
                term={t('saml_response')}
                value={
                  <>
                    <CopyToClipboardButton text={trace.context.samlResponse}></CopyToClipboardButton>
                    <SyntaxHighlighter language='xml' style={materialOceanic}>
                      {trace.context.samlResponse}
                    </SyntaxHighlighter>
                  </>
                }
              />
            )}
            {assertionType === 'Request' && trace.context.samlRequest && (
              <DescriptionListItem
                term={t('saml_request')}
                value={
                  <>
                    <CopyToClipboardButton text={trace.context.samlRequest}></CopyToClipboardButton>
                    <SyntaxHighlighter language='xml' style={materialOceanic}>
                      {trace.context.samlRequest}
                    </SyntaxHighlighter>
                  </>
                }
              />
            )}

            {typeof trace.context.profile === 'object' && trace.context.profile && (
              <DescriptionListItem
                term={t('profile')}
                value={
                  <SyntaxHighlighter language='json' style={materialOceanic}>
                    {JSON.stringify(trace.context.profile)}
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

export default SSOTraceInspector;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
