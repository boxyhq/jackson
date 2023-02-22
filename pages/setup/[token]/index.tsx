import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import Loading from '@components/Loading';
import useSetupLink from '@lib/ui/hooks/useSetupLink';

const SetupLinkIndexPage: NextPage = () => {
  const router = useRouter();

  const { token } = router.query as { token: string };

  const { setupLink, isLoading } = useSetupLink(token);

  if (isLoading) {
    return <Loading />;
  }

  // We can safely assume that the setupLink is valid here
  // because the SetupLink layout is doing the validation before rendering this page.

  switch (setupLink?.service) {
    case 'sso':
      router.replace(`/setup/${token}/sso-connection`);
      break;
    case 'dsync':
      router.replace(`/setup/${token}/directory-sync`);
      break;
  }

  return null;
};

export default SetupLinkIndexPage;
