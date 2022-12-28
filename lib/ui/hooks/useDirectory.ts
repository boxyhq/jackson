import useSWR from 'swr';
import type { Directory } from '@boxyhq/saml-jackson';
import type { ApiError, ApiSuccess } from 'types';
import { fetcher } from '@lib/ui/utils';

const useDirectory = (directoryId: string) => {
  const url = `/api/admin/directory-sync/${directoryId}`;

  const { data, error } = useSWR<ApiSuccess<Directory>, ApiError>(url, fetcher);

  return {
    directory: data?.data,
    isLoading: !data && !error,
    error,
  };
};

export default useDirectory;
