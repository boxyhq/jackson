import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const Retraced: NextPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.push('/admin/retraced/projects');
  }, [router]);

  return <p>Redirecting...</p>;
};

export default Retraced;
