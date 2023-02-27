import useSWR from 'swr';
import type { ApiError, ApiSuccess } from 'types';
import { fetcher } from '@lib/ui/utils';
import type { AdminPortalSettings } from '@boxyhq/saml-jackson';

const usePortalSettings = () => {
  const url = `/api/settings`;

  const { data, error, isLoading } = useSWR<ApiSuccess<AdminPortalSettings>, ApiError>(url, fetcher);

  return {
    settings: data?.data,
    isLoading,
    error,
  };
};

export default usePortalSettings;
