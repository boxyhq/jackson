import { useRouter } from 'next/router';

export default function IdPSelection() {
  const router = useRouter();

  const { idp: idpList, ...rest } = router.query as { idp?: string[] };

  const paramsToRelay = new URLSearchParams(Object.entries(rest));

  if (!Array.isArray(idpList)) {
    return <div>IdP list missing</div>;
  }

  return (
    <div className='relative top-1/2 left-1/2  w-1/2 max-w-xl  -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-md border-[1px] py-4 px-6 text-center'>
      <h1 className='mb-4 px-3 text-center text-lg font-bold text-black'>Choose an Identity Provider</h1>
      <ul className='max-h-96 overflow-auto'>
        {idpList?.map((idp) => {
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
