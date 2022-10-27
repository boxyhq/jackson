import type { NextPage } from 'next';
import useSWR from 'swr';
import { fetcher } from '@lib/ui/utils';
import { useRouter } from 'next/router';

const Setup: NextPage = () => {
  const router = useRouter();
  const { token } = router.query;
  const { data: setup } = useSWR<any>(token ? `/api/setup/${token}` : null, fetcher, { revalidateOnFocus: false });
  if (!token || !setup) {
    return null;
  } else {
    console.log(setup.data);
      switch(setup.data.path) {
        case '/admin/connection/new':
            router.replace(`/setup/${token}/connection`);
            return null;
        default:
            router.replace(`/setup/${token}/connection`);
            return null;
      }
  }
};

export default Setup;
