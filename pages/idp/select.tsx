import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import type { OIDCSSORecord, SAMLSSORecord } from '@boxyhq/saml-jackson';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import jackson from '@lib/jackson';

export default function ChooseIdPConnection({
  connections,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();
  const { t } = useTranslation('common');

  // Redirect to the same path with idp_hint set to the selected connection clientID
  const handleConnectionClick = (clientID: string) => {
    router.push(`${router.asPath}&idp_hint=${clientID}`);
  };

  return (
    <div className='mx-auto my-28 w-[500px]'>
      <div className='mx-5 flex flex-col space-y-10 rounded border border-gray-300 p-10'>
        <h3 className='text-center text-xl font-bold'>{t('choose_an_identity_provider')}</h3>
        <ul className='flex flex-col space-y-5'>
          {connections.map((connection) => {
            const idpMetadata = 'idpMetadata' in connection ? connection.idpMetadata : undefined;
            const oidcProvider = 'oidcProvider' in connection ? connection.oidcProvider : undefined;

            const name =
              connection.name || (idpMetadata ? idpMetadata.provider : `${oidcProvider?.provider}`);

            return (
              <li key={connection.clientID} className='rounded bg-gray-100'>
                <button
                  type='button'
                  className='w-full'
                  onClick={() => {
                    handleConnectionClick(connection.clientID);
                  }}>
                  <div className='flex items-center gap-2 py-3 px-3'>
                    <div className='placeholder avatar'>
                      <div className='w-8 rounded-full bg-primary text-white'>
                        <span className='text-xs font-bold'>{name.charAt(0).toUpperCase()}</span>
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
          Choose an Identity Provider to continue. If you don&apos;t see your Identity Provider, please
          contact your administrator.
        </p>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<{
  connections: (OIDCSSORecord | SAMLSSORecord)[];
}> = async ({ query, locale }) => {
  const { connectionAPIController } = await jackson();

  const paramsToRelay = { ...query } as { [key: string]: string };

  const { tenant, product, idp_hint, authFlow } = query as {
    tenant: string;
    product: string;
    authFlow: 'saml-federation' | 'oauth';
    idp_hint?: string;
  };

  // If the user has already selected an IdP, proceed to the next step
  if (idp_hint) {
    const params = new URLSearchParams(paramsToRelay).toString();

    const destinations = {
      'saml-federation': `/api/saml-federation/sso?${params}`,
      oauth: `/api/oauth/authorize?${params}`,
    };

    return {
      redirect: {
        destination: destinations[authFlow],
        permanent: false,
      },
    };
  }

  // Otherwise, show the list of IdPs
  const connections = await connectionAPIController.getConnections({ tenant, product });

  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
      connections,
    },
  };
};
