import type { NextPage } from 'next';
import useSWR from 'swr';
import { fetcher } from '@lib/ui/utils';
import { useRouter } from 'next/router';

const Setup: NextPage = () => {
  const router = useRouter();
  const { token } = router.query;
  const { data: setup, error } = useSWR<any>(token ? `/api/setup/${token}` : null, fetcher, {
    revalidateOnFocus: false,
  });
  if (error) {
    return (
      <div className='rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700'>
        {error.info ? JSON.stringify(error.info.error) : error.status}
      </div>
    );
  } else if (!token || !setup) {
    return null;
  } else {
    switch (setup.data.service) {
      case 'sso':
        router.replace(`/setup/${token}/sso-connection`);
        return null;
      case 'dsync':
        router.replace(`/setup/${token}/directory-sync`);
        return null;
      default:
        router.replace(`/`);
        return null;
    }
  }
};

export default Setup;
