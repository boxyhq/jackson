// export default function IdPSelection({ SAMLResponse, appList }) {
//   const router = useRouter();

//   const { idp: idpList, ...rest } = router.query as { idp?: string[] };

//   const formRef = useRef<HTMLFormElement>(null);
//   const [app, setApp] = useState<string>('');

//   const handleChange = (event: React.FormEvent<HTMLInputElement>) => {
//     setApp(event.currentTarget.value);
//   };

//   useEffect(() => {
//     if (app) {
//       formRef.current?.submit();
//     }
//   }, [app]);

//   if (Array.isArray(appList) && appList.length !== 0 && SAMLResponse) {
//     const paramsToRelay = Object.entries({ SAMLResponse });
//     return (
//       <form
//         ref={formRef}
//         action='/api/oauth/saml'
//         method='post'
//         className='relative top-1/2 left-1/2  w-1/2 max-w-xl  -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-md border-[1px] py-4 px-6 text-center'>
//         {paramsToRelay
//           .filter(([, value]) => value !== undefined)
//           .map(([key, value]) => (
//             <input key={key} type='hidden' name={key} value={value} />
//           ))}
//         <fieldset className='border-0'>
//           <legend className='mb-4 px-3 text-center text-lg font-bold text-black'>Select an App</legend>
//           <div className='max-h-96 overflow-auto'>
//             {appList.map((idp) => {
//               const { clientID, name, description, product } = idp;
//               return (
//                 <div className='relative my-2 border-b-[1px] bg-white last:border-b-0' key={clientID}>
//                   <input
//                     id={`radio-${clientID}`}
//                     name='idp_hint'
//                     type='radio'
//                     className={`peer sr-only`}
//                     value={clientID}
//                     checked={app === clientID}
//                     onChange={handleChange}
//                   />
//                   <label
//                     htmlFor={`radio-${clientID}`}
//                     className='relative flex w-full cursor-pointer flex-col items-start overflow-hidden py-3 px-8 text-[#3C454C] transition-colors hover:bg-primary/10 focus:bg-primary/30 peer-checked:bg-primary/25'>
//                     <span className='font-bold'>{name || product}</span>
//                     {description && <span className='font-light'>{description}</span>}
//                   </label>
//                 </div>
//               );
//             })}
//           </div>
//         </fieldset>
//         <input type='submit' value='submit' />
//       </form>
//     );
//   }

//   return <div className='text-black'>Selection list empty</div>;
// }

// export const getServerSideProps: GetServerSideProps = async ({ req }) => {
//   if (req.method == 'POST') {
//     const body = await getRawBody(req);
//     const payload = body.toString('utf-8');

//     const params = new URLSearchParams(payload);
//     const SAMLResponse = params.get('SAMLResponse') || '';
//     const app = decodeURIComponent(params.get('app') || '');

//     return { props: { SAMLResponse, appList: app ? JSON.parse(app) : [] } };
//   }
//   return { props: {} };
// };

import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import type { OIDCSSORecord, SAMLSSORecord } from '@boxyhq/saml-jackson';
import { useRouter } from 'next/router';

import jackson from '@lib/jackson';

export default function ChooseIdPConnection({
  connections,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();

  // Redirect to the same path with idp_hint set to the selected connection clientID
  const handleConnectionClick = (clientID: string) => {
    router.push(`${router.asPath}&idp_hint=${clientID}`);
  };

  return (
    <div className='mx-auto my-28 w-[500px]'>
      <div className='mx-5 flex flex-col space-y-10 rounded border border-gray-300 p-10'>
        <h3 className='text-center text-xl font-bold'>Choose an Identity Provider</h3>
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
}> = async ({ query }) => {
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

  return { props: { connections } };
};
