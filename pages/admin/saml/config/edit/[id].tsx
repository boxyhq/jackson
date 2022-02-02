import { NextPage } from 'next';
import useSWR from 'swr';
import { fetcher } from '@lib/utils';
import AddEdit from '@components/saml/AddEdit';
import { useRouter } from 'next/router';

const EditSAMLConfiguration: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { data: samlConfig, error } = useSWR(`/api/admin/saml/config/${id}`, fetcher, {
    revalidateOnFocus: false,
  });

  if (error) {
    return (
      <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded'>
        {error.info ? JSON.stringify(error.info) : error.status}
      </div>
    );
  }

  if (!samlConfig) {
    return <div>Loading...</div>;
  }
  return <AddEdit samlConfig={samlConfig?.config} />;
};

export default EditSAMLConfiguration;
