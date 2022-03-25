import { getCookie } from '@lib/utils';
import { useEffect, useState } from 'react';

export default function Error() {
  const [error, setError] = useState<string | undefined>('');
  useEffect(() => {
    setError(getCookie('jackson_error'));
  }, []);
  return <div className='text-black'>{error}</div>;
}
