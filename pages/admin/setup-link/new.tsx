import type { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import { useRouter } from 'next/router';
import CreateSetupLink from '@components/setup-link/CreateSetupLink';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { SetupLinkService } from '@boxyhq/saml-jackson';
import { setupLinkExpirationDays } from '@lib/env';

const serviceMaps = {
  'sso-connection': 'sso',
  'directory-sync': 'dsync',
};

type Props = InferGetServerSidePropsType<typeof getServerSideProps>;

const SetupLinkCreatePage = ({ expiryDays }: Props) => {
  const router = useRouter();

  // Extract the service name from the path
  const serviceName = router.asPath.split('/')[2];

  const service = serviceMaps[serviceName] as SetupLinkService;

  if (!service) {
    return null;
  }

  return <CreateSetupLink service={service} expiryDays={expiryDays} />;
};

export async function getServerSideProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
      expiryDays: setupLinkExpirationDays,
    },
  };
}

export default SetupLinkCreatePage;
