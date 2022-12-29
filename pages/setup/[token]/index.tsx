import type { NextPage } from 'next';
import useSWR from 'swr';
import { fetcher } from '@lib/ui/utils';
import { useRouter } from 'next/router';
import type { ApiError, ApiSuccess } from 'types';
import type { SetupLink } from '@boxyhq/saml-jackson';
import Loading from '@components/Loading';
import { errorToast } from '@components/Toaster';

const SetupLinksIndexPage: NextPage = () => {
  const router = useRouter();

  const { token } = router.query as { token: string };

  const { data, error } = useSWR<ApiSuccess<SetupLink>, ApiError>(
    token ? `/api/setup/${token}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  if (!data) {
    return <Loading />;
  }

  if (error) {
    errorToast(error.message);
    return null;
  }

  const setupLink = data.data;

  switch (setupLink.service) {
    case 'sso':
      router.replace(`/setup/${token}/sso-connection`);
      break;
    case 'dsync':
      router.replace(`/setup/${token}/directory-sync`);
      break;
    default:
      router.replace('/');
  }

  return null;
};

export default SetupLinksIndexPage;
