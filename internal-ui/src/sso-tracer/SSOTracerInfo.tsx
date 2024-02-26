import useSWR from 'swr';
import { useTranslation } from 'next-i18next';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter/dist/cjs';
import { materialOceanic } from 'react-syntax-highlighter/dist/cjs/styles/prism';

import { fetcher } from '../utils';
import type { SSOTrace } from '../types';
import { Loading, Error, PageHeader, Badge } from '../shared';
import { CopyToClipboardButton } from '../shared/InputWithCopyButton';

// TODO:
// Fix the translation keys

const ListItem = ({ term, value }: { term: string; value: string | JSX.Element }) => (
  <div className='grid grid-cols-3 py-3'>
    <dt className='text-sm font-medium text-gray-500'>{term}</dt>
    <dd className='text-sm text-gray-900 overflow-auto col-span-2'>{value}</dd>
  </div>
);

export const SSOTracerInfo = ({ urls }: { urls: { getTracer: string } }) => {
  const { t } = useTranslation('common');
  const { data, isLoading, error } = useSWR<{ data: SSOTrace & { traceId: string } }>(
    urls.getTracer,
    fetcher
  );

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error.message} />;
  }

  if (!data) {
    return null;
  }

  const trace = data.data;
  const assertionType = trace.context.samlResponse ? 'Response' : trace.context.samlRequest ? 'Request' : '-';

  return (
    <div className='space-y-3'>
      <PageHeader title={`${t('bui-trace-title')} - ${trace.traceId}`} />
      <dl className='divide-y'>
        <ListItem term={t('trace_id')} value={trace.traceId} />

        <ListItem term={t('assertion_type')} value={assertionType} />

        <ListItem
          term={t('sp_protocol')}
          value={
            <Badge
              color='primary'
              size='md'
              className='font-mono uppercase text-white'
              aria-label='SP Protocol'>
              {trace.context.requestedOIDCFlow
                ? 'OIDC'
                : trace.context.isSAMLFederated
                  ? t('saml_federation')
                  : trace.context.isIdPFlow
                    ? t('idp_login')
                    : 'OAuth 2.0'}
            </Badge>
          }
        />

        {typeof trace.timestamp === 'number' && (
          <ListItem term={t('timestamp')} value={new Date(trace.timestamp).toLocaleString()} />
        )}

        <ListItem term={t('error')} value={trace.error} />

        {trace.context.tenant && <ListItem term={t('tenant')} value={trace.context.tenant} />}

        {trace.context.product && <ListItem term={t('product')} value={trace.context.product} />}

        {trace.context.relayState && <ListItem term={t('relay_state')} value={trace.context.relayState} />}

        {trace.context.redirectUri && (
          <ListItem
            term={trace.context.isIDPFlow ? t('default_redirect_url') : t('redirect_uri')}
            value={trace.context.redirectUri}
          />
        )}

        {trace.context.clientID && (
          <ListItem term={t('sso_connection_client_id')} value={trace.context.clientID} />
        )}

        {trace.context.issuer && <ListItem term={t('issuer')} value={trace.context.issuer} />}

        {trace.context.acsUrl && <ListItem term={t('acs_url')} value={trace.context.acsUrl} />}

        {trace.context.entityId && <ListItem term={t('trace_entity_id')} value={trace.context.entityId} />}

        {trace.context.providerName && <ListItem term={t('provider')} value={trace.context.providerName} />}

        {assertionType === 'Response' && trace.context.samlResponse && (
          <ListItem
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
          <ListItem
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
          <ListItem
            term={t('profile')}
            value={
              <SyntaxHighlighter language='json' style={materialOceanic}>
                {JSON.stringify(trace.context.profile)}
              </SyntaxHighlighter>
            }
          />
        )}

        {trace.context.error_description && (
          <ListItem term={t('error_description_from_oidc_idp')} value={trace.context.error_description} />
        )}

        {trace.context.error_uri && <ListItem term={t('error_uri')} value={trace.context.error_uri} />}

        {trace.context.oidcTokenSet?.id_token && (
          <ListItem
            term={t('id_token_from_oidc_idp')}
            value={
              <>
                <CopyToClipboardButton text={trace.context.oidcTokenSet.id_token}></CopyToClipboardButton>
                <SyntaxHighlighter language='shell' style={materialOceanic}>
                  {trace.context.oidcTokenSet.id_token}
                </SyntaxHighlighter>
              </>
            }
          />
        )}

        {trace.context.oidcTokenSet?.access_token && (
          <ListItem
            term={t('access_token_from_oidc_idp')}
            value={
              <>
                <CopyToClipboardButton text={trace.context.oidcTokenSet.access_token}></CopyToClipboardButton>
                <SyntaxHighlighter language='shell' style={materialOceanic}>
                  {trace.context.oidcTokenSet.access_token}
                </SyntaxHighlighter>
              </>
            }
          />
        )}

        {trace.context.stack && (
          <ListItem
            term={t('stack_trace')}
            value={
              <SyntaxHighlighter language='shell' style={materialOceanic}>
                {trace.context.stack}
              </SyntaxHighlighter>
            }
          />
        )}

        {trace.context.session_state_from_op_error && (
          <ListItem
            term={t('session_state_from_oidc_idp')}
            value={trace.context.session_state_from_op_error}
          />
        )}

        {trace.context.scope_from_op_error && (
          <ListItem term={t('scope_from_op_error')} value={trace.context.scope_from_op_error} />
        )}
      </dl>
    </div>
  );
};
