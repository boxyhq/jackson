import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import type { SAMLSSORecord } from '@boxyhq/saml-jackson';
import { useRouter } from 'next/router';

import jackson from '@lib/jackson';

export default function ChooseIdPConnection({
  connections,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();

  const handleConnectionClick = (clientID: string) => {
    router.push(`${router.asPath}&idp=${clientID}`);
  };

  return (
    <div className='mx-auto my-28 w-[500px]'>
      <div className='mx-5 flex flex-col space-y-10 rounded border border-gray-300 p-10'>
        <h3 className='text-center text-xl font-bold'>Choose an Identity Provider</h3>
        <ul className='flex flex-col space-y-5'>
          {connections.map(({ clientID, name, idpMetadata }) => {
            const label = name ? `${name} (${idpMetadata.provider})` : idpMetadata.provider;

            return (
              <li key={clientID} className='rounded bg-gray-100'>
                <button
                  type='button'
                  className='w-full'
                  onClick={() => {
                    handleConnectionClick(clientID);
                  }}>
                  <div className='flex items-center gap-2 py-3 px-3'>
                    <div className='placeholder avatar'>
                      <div className='w-8 rounded-full bg-primary text-white'>
                        <span className='text-xs font-bold'>{label.charAt(0).toUpperCase()}</span>
                      </div>
                    </div>
                    {label}
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

export const getServerSideProps: GetServerSideProps<{ connections: SAMLSSORecord[] }> = async ({ query }) => {
  const { samlFederated } = await jackson();

  const { tenant, product, relayState, idp } = query as {
    tenant: string;
    product: string;
    relayState: string;
    idp?: string;
  };

  // If the user has already selected an IdP, create a SAML request and redirect to the IdP
  if (idp) {
    const { redirectUrl } = await samlFederated.sso.createSAMLRequest({ tenant, product, relayState, idp });

    return {
      redirect: {
        destination: redirectUrl,
        permanent: false,
      },
    };
  }

  // Otherwise, show the list of IdPs
  const connections = await samlFederated.sso.getConnections({ tenant, product, relayState });

  return { props: { connections } };
};
