import type { NextPage } from 'next';
import AddEdit from '@components/connection/AddEdit';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import { fetcher } from '@lib/ui/utils';

const NewConnection: NextPage = () => {
  const router = useRouter();
  const { token } = router.query;
  const { data: setup } = useSWR<any>(token ? `/api/setup/${token}` : null, fetcher, {
    revalidateOnFocus: false,
  });
  if (!token || !setup) {
    return null;
  } else {
    return (
      <AddEdit
        setup={{
          ...setup,
          token,
        }}
      />
    );
  }
};

export default NewConnection;
