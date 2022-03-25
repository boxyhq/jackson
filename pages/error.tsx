import { deleteCookie, getCookie, JACKSON_ERROR_COOKIE_KEY } from '@lib/utils';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function Error() {
  const [error, setError] = useState('');
  const { pathname } = useRouter();

  useEffect(() => {
    const _error = getCookie(JACKSON_ERROR_COOKIE_KEY) || '';
    setError(_error);
    // clear the cookie once read
    deleteCookie(JACKSON_ERROR_COOKIE_KEY, pathname);
  }, [pathname]);

  return <div className='text-black'>{error}</div>;
}
