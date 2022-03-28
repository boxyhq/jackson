import { getErrorCookie } from '@lib/ui/utils';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function Error() {
  const [error, setError] = useState({ statusCode: null, message: '' });
  const { pathname } = useRouter();

  useEffect(() => {
    const _error = getErrorCookie() || '';
    try {
      const { statusCode, message } = JSON.parse(_error);
      setError({ statusCode, message });
    } catch (err) {
      console.error('Unknown error format');
    }
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
    <div className='h-full'>
      <div className='h-[20%] translate-y-[100%] px-[20%] text-[hsl(152,56%,40%)]'>
        <svg className='mb-5 h-10 w-10' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
          />
        </svg>
        <h1 className='text-xl font-extrabold md:text-6xl'>{error.statusCode}</h1>
        <h2 className='uppercase'>{statusText}</h2>
        <p className='mt-6 inline-block'>SAML error: </p>
        <p className='mr-2 text-xl font-bold'>{message}</p>
      </div>
    </div>
  );
}
