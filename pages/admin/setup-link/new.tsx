import type { GetServerSidePropsContext, NextPage } from 'next';
import { useRouter } from 'next/router';
import CreateSetupLink from '@components/CreateSetupLink';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

type Service = 'sso' | 'dsync';

const SetupLink: NextPage = () => {
  const router = useRouter();
  const service = router.asPath.includes('sso-connection')
    ? 'sso'
    : router.asPath.includes('directory-sync')
    ? 'dsync'
    : '';
  if (!service) {
    return null;
  }
  return <CreateSetupLink service={service as Service} />;
};

export async function getServerSideProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default SetupLink;
