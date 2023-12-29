import useSWR from 'swr';

import { fetcher } from '@lib/ui/utils';
import type { ApiError, ApiSuccess } from 'types';

const usePortalBranding = (productId: string | undefined) => {
  const { data, error, isLoading } = useSWR<
    ApiSuccess<{
      logoUrl: string;
      primaryColor: string;
      faviconUrl: string;
      companyName: string;
    }>,
    ApiError
  >(productId ? `/api/branding?productId=${productId}` : null, fetcher);

  return {
    branding: data?.data,
    isLoading,
    error,
  };
};

export default usePortalBranding;
