import { useRouter } from 'next/router';

export default function IdPSelection() {
  const router = useRouter();

  const { idp: idpList, ...rest } = router.query as { idp?: string[] };

  const paramsToRelay = Object.entries(rest);

  if (!Array.isArray(idpList)) {
    return <div>IdP list missing</div>;
  }

  return (
    <form
      action='/api/oauth/authorize'
      className='relative top-1/2 left-1/2  w-1/2 max-w-xl  -translate-x-1/2 -translate-y-1/2 overflow-auto text-center'>
      {paramsToRelay
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => (
          <input key={key} type='hidden' name={key} value={value} />
        ))}
      <fieldset className='border-8 p-4'>
        <legend className='px-3 text-left text-black'>Select an Identity Provider</legend>
        <div className='max-h-96 overflow-auto'>
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
                  className='relative block w-full cursor-pointer overflow-hidden py-3 px-8 text-center text-[#3C454C] transition-colors peer-checked:bg-primary/25'>
                  {provider}
                </label>
              </div>
            );
          })}
        </div>
        <button type='submit' className='btn-primary'>
          Proceed
        </button>
      </fieldset>
    </form>
  );
}
