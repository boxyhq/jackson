import type { NextPage } from 'next';
import useSWR from 'swr';
import { useRouter } from 'next/router';

import { fetcher } from '@lib/ui/utils';
import AddEdit from '@components/saml/AddEdit';

const EditSAMLConfiguration: NextPage = () => {
  const router = useRouter();

  const { id } = router.query;

  const { data: samlConfig, error } = useSWR(`/api/admin/saml/config/${id}`, fetcher, {
    revalidateOnFocus: false,
  });

  if (error) {
    return (
      <div className='rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700'>
        {error.info ? JSON.stringify(error.info) : error.status}
      </div>
    );
  }

  if (!samlConfig) {
    return null;
  }

  return <AddEdit samlConfig={samlConfig} />;
};

export default EditSAMLConfiguration;
