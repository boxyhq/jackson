import { useRouter } from 'next/router';
import { notFound } from 'next/navigation';
import { SetupLinks } from '@boxyhq/internal-ui';
import type { SetupLinkService } from '@boxyhq/saml-jackson';
import type { GetServerSidePropsContext, NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const serviceMap = {
  sso: 'sso-connection',
  dsync: 'directory-sync',
} as const;

const SetupLinksIndexPage: NextPage = () => {
  const router = useRouter();

  let service: SetupLinkService | null = null;

  if (router.asPath.includes('sso-connection')) {
    service = 'sso';
  } else if (router.asPath.includes('directory-sync')) {
    service = 'dsync';
  }

  if (!service) {
    return notFound();
  }

  return (
    <SetupLinks
      service={service}
      urls={{ getLinks: '/api/admin/setup-links' }}
      actions={{ newLink: `/admin/${serviceMap[service]}/setup-link/new` }}
    />
  );
};

export async function getStaticProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default SetupLinksIndexPage;
