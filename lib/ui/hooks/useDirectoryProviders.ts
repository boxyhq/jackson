import useSWR from 'swr';
import type { DirectorySyncProviders } from '@boxyhq/saml-jackson';
import type { ApiError, ApiSuccess } from 'types';
import { fetcher } from '@lib/ui/utils';

const useDirectoryProviders = () => {
  const url = '/api/admin/directory-sync/providers';

  const { data, error } = useSWR<ApiSuccess<DirectorySyncProviders>, ApiError>(url, fetcher);

  return {
    providers: data?.data,
    isLoading: !data && !error,
    error,
  };
};

export default useDirectoryProviders;
