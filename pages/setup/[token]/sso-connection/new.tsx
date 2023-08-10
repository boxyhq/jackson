import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import useIdpEntityID from '@lib/ui/hooks/useIdpEntityID';
import CreateConnection from '@components/connection/CreateConnection';

const ConnectionCreatePage: NextPage = () => {
  const router = useRouter();
  const { idpEntityID } = useIdpEntityID();

  const { token } = router.query as { token: string };

  return <CreateConnection setupLinkToken={token} idpEntityID={idpEntityID} />;
};

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}

export default ConnectionCreatePage;
