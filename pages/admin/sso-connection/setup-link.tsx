import type { GetServerSidePropsContext, NextPage } from 'next';
import SetupLinkList from '@components/setup-link/SetupLinkList';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';

const SetupLinksIndexPage: NextPage = () => {
  const router = useRouter();
  const service = router.asPath.includes('sso-connection')
    ? 'sso'
    : router.asPath.includes('directory-sync')
    ? 'dsync'
    : '';

  if (service.length === 0) {
    return null;
  }

  return <SetupLinkList service={service} />;
};

export async function getStaticProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default SetupLinksIndexPage;
