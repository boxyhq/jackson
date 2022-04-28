import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import getRawBody from 'raw-body';
import { useEffect, useRef, useState } from 'react';

export default function IdPSelection({ SAMLResponse, appList }) {
  const router = useRouter();

  const { idp: idpList, ...rest } = router.query as { idp?: string[] };

  const formRef = useRef<HTMLFormElement>(null);
  const [app, setApp] = useState<string>('');

  const handleChange = (event: React.FormEvent<HTMLInputElement>) => {
    setApp(event.currentTarget.value);
  };

  useEffect(() => {
    if (app) {
      formRef.current?.submit();
    }
  }, [app]);

  if (Array.isArray(idpList) && idpList.length !== 0) {
    const paramsToRelay = new URLSearchParams(Object.entries(rest));
    return (
      <div className='relative top-1/2 left-1/2  w-1/2 max-w-xl  -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-md border-[1px] py-4 px-6 text-center'>
        <h1 className='mb-4 px-3 text-center text-lg font-bold text-black'>Choose an Identity Provider</h1>
        <ul className='max-h-96 overflow-auto'>
          {idpList.map((idp) => {
            const { clientID, provider } = JSON.parse(idp);
            return (
              <li className='relative my-3 border-b-[1px] bg-white last:border-b-0' key={clientID}>
                <a
                  href={`/api/oauth/authorize?${paramsToRelay.toString()}&idp_hint=${clientID}`}
                  className='relative block w-full cursor-pointer overflow-hidden  py-3 px-8 text-center text-[#3C454C] outline-none transition-colors hover:bg-primary/10 focus:bg-primary/30'>
                  {provider}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
  if (Array.isArray(appList) && appList.length !== 0 && SAMLResponse) {
    const paramsToRelay = Object.entries({ SAMLResponse });
    return (
      <form
        ref={formRef}
        action='/api/oauth/saml'
        method='post'
        className='relative top-1/2 left-1/2  w-1/2 max-w-xl  -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-md border-[1px] py-4 px-6 text-center'>
        {paramsToRelay
          .filter(([, value]) => value !== undefined)
          .map(([key, value]) => (
            <input key={key} type='hidden' name={key} value={value} />
          ))}
        <fieldset className='border-0'>
          <legend className='mb-4 px-3 text-center text-lg font-bold text-black'>Select an App</legend>
          <div className='max-h-96 overflow-auto'>
            {appList.map((idp) => {
              const { clientID, name, description, product } = idp;
              return (
                <div className='relative my-3 border-b-[1px] bg-white last:border-b-0' key={clientID}>
                  <input
                    id={`radio-${clientID}`}
                    name='idp_hint'
                    type='radio'
                    className={`peer sr-only`}
                    value={clientID}
                    checked={app === clientID}
                    onChange={handleChange}
                  />
                  <label
                    htmlFor={`radio-${clientID}`}
                    className='relative block w-full cursor-pointer overflow-hidden py-3 px-8 text-center text-[#3C454C] transition-colors hover:bg-primary/10 focus:bg-primary/30 peer-checked:bg-primary/25'>
                    {name || product}
                    {description && <span>{description}</span>}
                  </label>
                </div>
              );
            })}
          </div>
        </fieldset>
        <input type='submit' value='submit' />
      </form>
    );
  }

  return <div>Selection list empty</div>;
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  if (req.method == 'POST') {
    const body = await getRawBody(req);
    const payload = body.toString('utf-8');

    const params = new URLSearchParams(payload);
    const SAMLResponse = params.get('SAMLResponse') || '';
    const app = decodeURIComponent(params.get('app') || '');

    return { props: { SAMLResponse, appList: app ? JSON.parse(app) : [] } };
  }
  return { props: {} };
};
