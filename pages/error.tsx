import { deleteCookie, getCookie, JACKSON_ERROR_COOKIE_KEY } from '@lib/utils';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function Error() {
  const [error, setError] = useState({ statusCode: null, message: '' });
  const { pathname } = useRouter();

  useEffect(() => {
    const _error = getCookie(JACKSON_ERROR_COOKIE_KEY) || '';
    try {
      const { statusCode, message } = JSON.parse(_error);
      setError({ statusCode, message });
    } catch (err) {
      console.error('Unknown error format');
    }
    // clear the cookie once read
    deleteCookie(JACKSON_ERROR_COOKIE_KEY, pathname);
  }, [pathname]);
  const { statusCode, message } = error;
  let statusText = '';
  if (typeof statusCode === 'number') {
    if (statusCode >= 400 && statusCode <= 499) {
      statusText = 'client-side error';
    }
    if (statusCode >= 500 && statusCode <= 599) {
      statusText = 'server error';
    }
  }

  if (statusCode === null) {
    return null;
  }

  return (
    <div className='flex h-full items-center justify-center p-8 md:px-[6%] md:py-[10%]'>
      <div className='dot-pattern relative -mt-10 flex  w-full flex-col items-center justify-center rounded-md p-5 text-[#0a2540] shadow-xl sm:h-[500px] sm:w-[500px]'>
        <h1 className='text-xl font-extrabold md:text-6xl'>{error.statusCode}</h1>
        <h2 className='mt-2 text-lg md:text-4xl'>{statusText}</h2>
        <p className='mt-6 inline-block'>SAML error: </p>
        <p className='mr-2 text-xl font-bold'>{message}</p>
      </div>
    </div>
  );
}
