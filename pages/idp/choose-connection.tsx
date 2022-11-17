import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import type { SAMLSSORecord } from '@boxyhq/saml-jackson';
import { useRouter } from 'next/router';

import jackson from '@lib/jackson';

export default function ChooseIdPConnection({
  connections,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();

  console.log(connections);

  return (
    <div className='mx-auto my-20 w-96 rounded border border-gray-300 p-2'>
      <h3 className='text-center font-bold'>Choose an Identity Provider to continue</h3>
      <div className='text-center '>
        <ul>
          {connections.map((connection) => (
            <li key={connection.clientID}>
              <button
                type='button'
                onClick={() => {
                  router.push(`/idp/${connection.clientID}`);
                }}>
                {connection.idpMetadata.entityID}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<{ connections: SAMLSSORecord[] }> = async ({ query }) => {
  const { samlFederated } = await jackson();

  const { tenant, product, relayState } = query as {
    tenant: string;
    product: string;
    relayState: string;
  };

  const connections = await samlFederated.sso.getConnections({ tenant, product, relayState });

  return { props: { connections } };
};
