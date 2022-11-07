import type { NextPage } from 'next';
import ConnectionList from '@components/connection/ConnectionList';
import { useRouter } from 'next/router';

const Connections: NextPage = () => {
  const router = useRouter();
  const { token } = router.query;
  return token ? <ConnectionList setupToken={token as string} /> : null;
};

export default Connections;
