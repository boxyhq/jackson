import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';

export default function IdPSelection() {
  const router = useRouter();
  const routerRef = useRef(router);

  routerRef.current = router;

  const { idp: idpList, ...rest } = router.query as { idp?: string[] };

  useEffect(() => {
    if (routerRef.current.isReady && !Array.isArray(idpList)) {
      routerRef.current.push('/error');
    }
  }, [idpList]);

  const paramsToRelay = Object.entries(rest);

  return (
    <form action='/api/oauth/authorize'>
      {paramsToRelay
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => (
          <input key={key} type='hidden' name={key} value={value} />
        ))}
      {idpList?.map((idp) => {
        const { clientID, provider } = JSON.parse(idp);
        return (
          <div className='relative my-3 bg-white' key={clientID}>
            <input
              id={`radio-${clientID}`}
              name='idpSelected'
              type='radio'
              className={`peer sr-only`}
              value={clientID}
            />
            <label
              htmlFor={`radio-${clientID}`}
              className='relative block w-full cursor-pointer overflow-hidden py-3 px-8 text-left text-[#3C454C] transition-colors peer-checked:bg-[#5562eb]'>
              {provider}
            </label>
          </div>
        );
      })}
      <button type='submit' className='btn-primary'>
        Proceed
      </button>
    </form>
  );
}
