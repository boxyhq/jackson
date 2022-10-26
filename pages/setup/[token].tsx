import type { NextPage } from 'next';
import AddEdit from '@components/connection/AddEdit';
import ConnectionList from '@components/connection/ConnectionList';
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
          return (
            <>
              <ConnectionList setupToken={token as string} />
              <AddEdit setup={{ ...setup.data, token }}  />
            </>
          );
        default:
          return (
            <>
              <ConnectionList setupToken={token as string} />
              <AddEdit setup={{ ...setup.data, token }} />
            </>
          );
      }
  }
};

export default Setup;
