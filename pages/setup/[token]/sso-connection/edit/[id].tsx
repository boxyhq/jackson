import type { NextPage } from 'next';
import useSWR from 'swr';
import { useRouter } from 'next/router';

import { fetcher } from '@lib/ui/utils';
import AddEdit from '@components/connection/AddEdit';

const EditConnection: NextPage = () => {
  const router = useRouter();

  const { id, token } = router.query;
  const { data: setup } = useSWR<any>(token ? `/api/setup/${token}` : null, fetcher, {
    revalidateOnFocus: false,
  });
  const { data: connection, error } = useSWR(
    token ? (id ? `/api/setup/${token}/connections/${id}` : null) : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  if (error) {
    return (
      <div className='rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700'>
        {error.info ? JSON.stringify(error.info) : error.status}
      </div>
    );
  }

  if (!connection) {
    return null;
  }

  return (
    <AddEdit
      connection={connection}
      setup={{
        ...setup,
        token,
      }}
    />
  );
};

export default EditConnection;
