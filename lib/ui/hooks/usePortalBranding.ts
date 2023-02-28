import useSWR from 'swr';
import type { ApiError, ApiSuccess } from 'types';
import { fetcher } from '@lib/ui/utils';
import type { AdminPortalBranding } from '@boxyhq/saml-jackson';

const usePortalBranding = () => {
  const url = '/api/branding';

  const { data, error, isLoading } = useSWR<ApiSuccess<AdminPortalBranding>, ApiError>(url, fetcher);

  return {
    branding: data?.data,
    isLoading,
    error,
  };
};

export default usePortalBranding;
