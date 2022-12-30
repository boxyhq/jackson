import useSWR from 'swr';
import type { SetupLink } from '@boxyhq/saml-jackson';
import type { ApiError, ApiSuccess } from 'types';
import { fetcher } from '@lib/ui/utils';

const useSetupLink = (setupLinkToken: string) => {
  const url = setupLinkToken ? `/api/setup/${setupLinkToken}` : null;

  const { data, error } = useSWR<ApiSuccess<SetupLink>, ApiError>(url, fetcher);

  return {
    setupLink: data?.data,
    isLoading: !data && !error,
    error,
  };
};

export default useSetupLink;
