import useSWR from 'swr';
import type { ApiError, ApiSuccess } from 'types';
import { fetcher } from '@lib/ui/utils';

const usePortalBranding = () => {
  const url = '/api/branding';

  const { data, error, isLoading } = useSWR<
    ApiSuccess<{
      logoUrl: string;
      primaryColor: string;
      faviconUrl: string;
      companyName: string;
    }>,
    ApiError
  >(url, fetcher);

  return {
    branding: data?.data,
    isLoading,
    error,
  };
};

export default usePortalBranding;
