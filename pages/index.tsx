import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const Home: NextPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.push('/admin/saml/config');
  }, [router]);

  return <p>Redirecting...</p>;
};

export default Home;
