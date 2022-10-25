import type { NextPage } from 'next';
import AddEdit from '@components/connection/AddEdit';
import useSWR from 'swr';
import { fetcher } from '@lib/ui/utils';
import { useRouter } from 'next/router';

const Setup: NextPage = () => {
  const router = useRouter();
  const { token } = router.query;
  const { data: setup } = useSWR<any>([`/api/setup/${token}`], fetcher, { revalidateOnFocus: false });
  if (!token || !setup) {
    return null;
  } else {
    console.log(setup.data);
      switch(setup.data.path) {
        case '/admin/connection/new':
          return <AddEdit setup={setup.data}/>;
        default:
          return <AddEdit setup={setup.data}/>;
      }
  }
};

export default Setup;
