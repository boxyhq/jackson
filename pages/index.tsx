import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const Home: NextPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.push('/admin/connection');
  }, [router]);

  return (
    <div
      style={{
        margin: 'auto',
        textAlign: 'center',
      }}>
      <progress className='progress progress-primary w-56'></progress>
    </div>
  );
};

export default Home;
