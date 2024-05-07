import useSWR from 'swr';
import { useTranslation } from 'next-i18next';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter/dist/cjs';
import { materialOceanic } from 'react-syntax-highlighter/dist/cjs/styles/prism';

import { fetcher } from '../utils';
import type { SSOTrace } from '../types';
import { Loading, Error, PageHeader, Badge } from '../shared';
import { CopyToClipboardButton } from '../shared/InputWithCopyButton';

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

  let badgeText = '';
  if (trace.context.isOIDCFederated) {
    if (trace.context.requestedOIDCFlow) {
      badgeText = t('bui-shared-oidc-federation');
    } else {
      badgeText = t('bui-tracer-oauth2-federation');
    }
  } else if (trace.context.isSAMLFederated) {
    badgeText = t('bui-tracer-saml-federation');
  } else if (trace.context.isIdPFlow) {
    badgeText = t('bui-tracer-idp-login');
  } else if (trace.context.requestedOIDCFlow) {
    badgeText = t('bui-shared-oidc');
  } else {
    badgeText = t('bui-tracer-oauth2');
  }

  return (
    <div className='space-y-3'>
      <PageHeader title={t('bui-tracer-title')} />
      <dl className='divide-y'>
        <ListItem term={t('bui-tracer-id')} value={trace.traceId} />

        <ListItem term={t('bui-tracer-assertion-type')} value={assertionType} />

        <ListItem
          term={t('bui-tracer-sp-protocol')}
          value={
            <Badge
              color='primary'
              size='md'
              className='font-mono uppercase text-white'
              aria-label={t('bui-tracer-sp-protocol')!}>
              {badgeText}
            </Badge>
          }
        />

        {typeof trace.timestamp === 'number' && (
          <ListItem term={t('bui-tracer-timestamp')} value={new Date(trace.timestamp).toLocaleString()} />
        )}

        <ListItem term={t('bui-tracer-error')} value={trace.error} />

        {trace.context.tenant && <ListItem term={t('bui-shared-tenant')} value={trace.context.tenant} />}

        {trace.context.product && <ListItem term={t('bui-shared-product')} value={trace.context.product} />}

        {trace.context.relayState && (
          <ListItem term={t('bui-tracer-relay-state')} value={trace.context.relayState} />
        )}

        {trace.context.redirectUri && (
          <ListItem
            term={
              trace.context.isIdPFlow ? t('bui-tracer-default-redirect-url') : t('bui-tracer-redirect-uri')
            }
            value={trace.context.redirectUri}
          />
        )}

        {trace.context.clientID && (
          <ListItem term={t('bui-tracer-sso-connection-client-id')} value={trace.context.clientID} />
        )}

        {trace.context.issuer && <ListItem term={t('bui-tracer-issuer')} value={trace.context.issuer} />}

        {trace.context.acsUrl && <ListItem term={t('bui-shared-acs-url')} value={trace.context.acsUrl} />}

        {trace.context.entityId && (
          <ListItem term={t('bui-tracer-entity-id')} value={trace.context.entityId} />
        )}

        {trace.context.providerName && (
          <ListItem term={t('bui-tracer-provider')} value={trace.context.providerName} />
        )}

        {assertionType === 'Response' && trace.context.samlResponse && (
          <ListItem
            term={t('bui-tracer-saml-response')}
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
            term={t('bui-tracer-saml-request')}
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
            term={t('bui-tracer-profile')}
            value={
              <SyntaxHighlighter language='json' style={materialOceanic}>
                {JSON.stringify(trace.context.profile)}
              </SyntaxHighlighter>
            }
          />
        )}

        {trace.context.error_description && (
          <ListItem
            term={t('bui-tracer-error-description-from-oidc-idp')}
            value={trace.context.error_description}
          />
        )}

        {trace.context.error_uri && (
          <ListItem term={t('bui-tracer-error-uri')} value={trace.context.error_uri} />
        )}

        {trace.context.oidcTokenSet?.id_token && (
          <ListItem
            term={t('bui-tracer-id-token-from-oidc-idp')}
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
            term={t('bui-tracer-access-token-from-oidc-idp')}
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
            term={t('bui-tracer-stack-trace')}
            value={
              <SyntaxHighlighter language='shell' style={materialOceanic}>
                {trace.context.stack}
              </SyntaxHighlighter>
            }
          />
        )}

        {trace.context.session_state_from_op_error && (
          <ListItem
            term={t('bui-tracer-session-state-from-oidc-idp')}
            value={trace.context.session_state_from_op_error}
          />
        )}

        {trace.context.scope_from_op_error && (
          <ListItem term={t('bui-tracer-scope-from-op-error')} value={trace.context.scope_from_op_error} />
        )}
      </dl>
    </div>
  );
};
