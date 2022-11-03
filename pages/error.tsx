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
      statusText = 'client error';
    }
    if (statusCode >= 500 && statusCode <= 599) {
      statusText = 'server error';
    }
  }

  if (statusCode === null) {
    return null;
  }

  return (
    <div className='flex h-screen'>
      <div className='m-auto'>
        <section className='bg-white dark:bg-gray-900'>
          <div className='mx-auto max-w-screen-xl py-8 px-4 lg:py-16 lg:px-6'>
            <div className='mx-auto max-w-screen-sm text-center'>
              <h1 className='mb-4 text-7xl font-extrabold tracking-tight text-primary lg:text-9xl'>
                {error.statusCode}
              </h1>
              <p className='mb-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white md:text-4xl'>
                {statusText}
              </p>
              <p className='mb-4 text-lg font-light'>SAML error: {message}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
