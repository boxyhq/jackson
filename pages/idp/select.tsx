import { useRef } from 'react';
import getRawBody from 'raw-body';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import type { OIDCSSORecord, SAMLSSORecord } from '@boxyhq/saml-jackson';
import type { InferGetServerSidePropsType } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import jackson from '@lib/jackson';
import Head from 'next/head';
import { hexToHsl, darkenHslColor } from '@lib/color';
import Image from 'next/image';
import { PoweredBy } from '@components/PoweredBy';
import { getPortalBranding } from '@lib/settings';

export default function ChooseIdPConnection({
  connections,
  SAMLResponse,
  requestType,
  branding,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { t } = useTranslation('common');

  const primaryColor = hexToHsl(branding.primaryColor);
  const title = requestType === 'sp-initiated' ? t('select_an_idp') : t('select_an_app');

  return (
    <div className='mx-auto my-28 w-[500px]'>
      <div className='mx-5 flex flex-col space-y-10 rounded border border-gray-300 p-10'>
        <Head>
          <title>{`${title} - ${branding.companyName}`}</title>
          {branding?.faviconUrl && <link rel='icon' href={branding.faviconUrl} />}
        </Head>

        {primaryColor && (
          <style>{`:root { --p: ${primaryColor}; --pf: ${darkenHslColor(primaryColor, 30)}; }`}</style>
        )}

        {branding?.logoUrl && (
          <div className='flex justify-center'>
            <Image src={branding.logoUrl} alt={branding.companyName} width={50} height={50} />
          </div>
        )}

        {requestType === 'sp-initiated' ? (
          <IdpSelector connections={connections} />
        ) : (
          <AppSelector connections={connections} SAMLResponse={SAMLResponse} />
        )}
      </div>
      <div className='my-4'>
        <PoweredBy />
      </div>
    </div>
  );
}

const IdpSelector = ({ connections }: { connections: (OIDCSSORecord | SAMLSSORecord)[] }) => {
  const router = useRouter();
  const { t } = useTranslation('common');

  // SP initiated SSO: Redirect to the same path with idp_hint set to the selected connection clientID
  const connectionSelected = (clientID: string) => {
    return router.push(`${router.asPath}&idp_hint=${clientID}`);
  };

  return (
    <>
      <h3 className='text-center text-xl font-bold'>{t('select_an_idp')}</h3>
      <ul className='flex flex-col space-y-5'>
        {connections.map((connection) => {
          const idpMetadata = 'idpMetadata' in connection ? connection.idpMetadata : undefined;
          const oidcProvider = 'oidcProvider' in connection ? connection.oidcProvider : undefined;

          const name =
            connection.name ||
            (idpMetadata
              ? idpMetadata.friendlyProviderName || idpMetadata.provider
              : `${oidcProvider?.provider}`);

          return (
            <li key={connection.clientID} className='rounded bg-gray-100'>
              <button
                type='button'
                className='w-full'
                onClick={() => {
                  connectionSelected(connection.clientID);
                }}>
                <div className='flex items-center gap-2 px-3 py-3'>
                  <div className='placeholder avatar'>
                    <div className='w-8 rounded-full bg-primary text-white'>
                      <span className='text-lg font-bold'>{name.charAt(0).toUpperCase()}</span>
                    </div>
                  </div>
                  {name}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
      <p className='text-center text-sm text-slate-600'>
        Choose an Identity Provider to continue. If you don&apos;t see your Identity Provider, please contact
        your administrator.
      </p>
    </>
  );
};

const AppSelector = ({
  connections,
  SAMLResponse,
}: {
  connections: (OIDCSSORecord | SAMLSSORecord)[];
  SAMLResponse: string | null;
}) => {
  const { t } = useTranslation('common');
  const formRef = useRef<HTMLFormElement>(null);

  if (!SAMLResponse) {
    return <p className='text-center text-sm text-slate-600'>No SAMLResponse found.</p>;
  }

  // IdP initiated SSO: Submit the SAMLResponse and idp_hint to the SAML ACS endpoint
  const appSelected = () => {
    formRef.current?.submit();
  };

  return (
    <>
      <h3 className='text-center text-xl font-bold'>{t('select_an_app')}</h3>
      <form method='POST' action='/api/oauth/saml' ref={formRef}>
        <input type='hidden' name='SAMLResponse' value={SAMLResponse} />
        <ul className='flex flex-col space-y-5'>
          {connections.map((connection) => {
            return (
              <li key={connection.clientID} className='rounded bg-gray-100'>
                <div className='flex items-center gap-2 px-3 py-3'>
                  <input
                    type='radio'
                    name='idp_hint'
                    className='radio'
                    value={connection.clientID}
                    onChange={appSelected}
                    id={connection.clientID}
                  />
                  <label htmlFor={connection.clientID}>{connection.product}</label>
                </div>
              </li>
            );
          })}
        </ul>
      </form>
      <p className='text-center text-sm text-slate-600'>
        Choose an app to continue. If you don&apos;t see your app, please contact your administrator.
      </p>
    </>
  );
};

export const getServerSideProps = async ({ query, locale, req }) => {
  const { connectionAPIController, samlFederatedController, checkLicense } = await jackson();

  const paramsToRelay = { ...query } as { [key: string]: string };

  const { authFlow, entityId, tenant, product, idp_hint, samlFedAppId } = query as {
    authFlow: 'saml' | 'oauth';
    tenant?: string;
    product?: string;
    idp_hint?: string;
    entityId?: string;
    samlFedAppId?: string;
  };

  // The user has selected an IdP to continue with
  if (idp_hint) {
    const params = new URLSearchParams(paramsToRelay).toString();

    const destination =
      authFlow === 'saml' ? `/api/saml-federation/sso?${params}` : `/api/oauth/authorize?${params}`;

    return {
      redirect: {
        destination,
        permanent: false,
      },
    };
  }

  // Otherwise, show the list of IdPs
  let connections: (OIDCSSORecord | SAMLSSORecord)[] = [];

  if (tenant && product) {
    connections = await connectionAPIController.getConnections({ tenant, product });
  } else if (entityId) {
    connections = await connectionAPIController.getConnections({ entityId: decodeURIComponent(entityId) });
  }

  const samlFederationApp = samlFedAppId ? await samlFederatedController.app.get({ id: samlFedAppId }) : null;

  if (samlFedAppId && !samlFederationApp) {
    return {
      notFound: true,
    };
  }

  // Get the branding to use for the IdP selector screen
  let branding = await getPortalBranding();

  // For SAML federated requests, use the branding from the SAML federated app
  if (samlFederationApp && (await checkLicense())) {
    branding = {
      logoUrl: samlFederationApp?.logoUrl || branding.logoUrl,
      primaryColor: samlFederationApp?.primaryColor || branding.primaryColor,
      faviconUrl: samlFederationApp?.faviconUrl || branding.faviconUrl,
      companyName: samlFederationApp?.name || branding.companyName,
    };
  }

  // For idp-initiated flows, we need to parse the SAMLResponse from the request body and pass it to the component
  if (req.method == 'POST') {
    const body = await getRawBody(req);
    const params = new URLSearchParams(body.toString('utf-8'));

    const SAMLResponse = params.get('SAMLResponse');

    // SAMLResponse should exist with idp-initiated flow
    if (!SAMLResponse) {
      return {
        notFound: true,
      };
    }

    return {
      props: {
        ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
        requestType: 'idp-initiated',
        SAMLResponse,
        connections,
        branding,
      },
    };
  }

  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
      requestType: 'sp-initiated',
      SAMLResponse: null,
      connections,
      branding,
    },
  };
};
