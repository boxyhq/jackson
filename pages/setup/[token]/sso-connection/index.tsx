import type { NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { ConnectionList } from '@boxyhq/react-ui/sso';
import { useRouter } from 'next/router';
import useIdpEntityID from '@lib/ui/hooks/useIdpEntityID';
import usePaginate from '@lib/ui/hooks/usePaginate';

const ConnectionsIndexPage: NextPage = () => {
  const router = useRouter();
  const { idpEntityID } = useIdpEntityID();
  const isSettingsView = false;
  const { paginate } = usePaginate();
  // The token value can be used to determine the value of setupLinkToken
  const { token } = router.query as { token: string };
  const getConnectionsUrl = token
    ? `/api/setup/${token}/sso-connection`
    : isSettingsView
    ? `/api/admin/connections?isSystemSSO`
    : `/api/admin/connections?pageOffset=${paginate.offset}&pageLimit=${token}`;

  function handleActionClick(e: any) {
    console.log('hello world');
  }

  return (
    <ConnectionList
      handleActionClick={handleActionClick}
      getConnectionsUrl={getConnectionsUrl}
      idpEntityID={idpEntityID}
    />
  );
};

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}

export default ConnectionsIndexPage;
