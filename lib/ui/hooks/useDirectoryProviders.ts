import useSWR from 'swr';
import type { DirectorySyncProviders } from '@npm/src/index';
import type { ApiError, ApiSuccess } from 'types';
import { fetcher } from '@lib/ui/utils';

const useDirectoryProviders = (setupLinkToken?: string) => {
  const url = setupLinkToken
    ? `/api/setup/${setupLinkToken}/directory-sync/providers`
    : '/api/admin/directory-sync/providers';

  const { data, error, isLoading } = useSWR<ApiSuccess<DirectorySyncProviders>, ApiError>(url, fetcher);

  return {
    providers: data?.data,
    isLoading,
    error,
  };
};

export default useDirectoryProviders;
