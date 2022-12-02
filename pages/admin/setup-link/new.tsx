import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import CreateSetupLink from '@components/CreateSetupLink';

type Service = 'sso' | 'dsync';

const SetupLink: NextPage = () => {
  const router = useRouter();
  const service = router.asPath.includes('sso-connection')
    ? 'sso'
    : router.asPath.includes('directory-sync')
    ? 'dsync'
    : '';
  if(!service) {
    return null;
  }
  return <CreateSetupLink service={service as Service} />;
};

export default SetupLink;
