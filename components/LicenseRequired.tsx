import useSWR from 'swr';

import { fetcher } from '@lib/ui/utils';
import EmptyState from './EmptyState';
import Loading from './Loading';

type Props = {
  children: React.ReactNode;
};

const LicenseRequired = (props: Props) => {
  const { children } = props;

  const { data, error } = useSWR<{ data: { status: boolean } }>('/api/admin/license', fetcher);

  if (!data && !error) {
    return <Loading />;
  }

  const hasValidLicense = data?.data.status;

  return (
    <>
      {hasValidLicense ? (
        children
      ) : (
        <EmptyState
          title='This is an Enterprise feature.'
          description="Please add a valid license to use this feature. If you don't have a license, please contact BoxyHQ Support."
        />
      )}
    </>
  );
};

export default LicenseRequired;
