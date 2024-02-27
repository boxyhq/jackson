import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import type { SetupLinkService } from '@boxyhq/saml-jackson';
import { LinkBack, NewSetupLink } from '@boxyhq/internal-ui';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';

import { setupLinkExpiryDays } from '@lib/env';
import { errorToast, successToast } from '@components/Toaster';

const serviceMaps = {
  'sso-connection': 'sso',
  'directory-sync': 'dsync',
};

const SetupLinkCreatePage = ({ expiryDays }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter();
  const { t } = useTranslation('common');

  // Extract the service name from the path
  const serviceName = router.asPath.split('/')[2];

  const service = serviceMaps[serviceName] as SetupLinkService;

  if (!service) {
    return null;
  }

  return (
    <div className='space-y-4'>
      <LinkBack href={`/admin/${serviceName}/setup-link`} />
      <NewSetupLink
        urls={{ createLink: '/api/admin/setup-links' }}
        service={service}
        expiryDays={expiryDays}
        onCreate={() => {
          successToast(t('link_generated'));
        }}
        onError={(error) => errorToast(error.message)}
      />
    </div>
  );
};

export async function getServerSideProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
      expiryDays: setupLinkExpiryDays,
    },
  };
}

export default SetupLinkCreatePage;
