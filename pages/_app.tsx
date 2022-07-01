import Layout from '@components/Layout';
import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { Toaster } from 'react-hot-toast';
import '../styles/globals.css';

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const { pathname } = useRouter();

  if (pathname !== '/' && !pathname.startsWith('/admin')) {
    return <Component {...pageProps} />;
  }

  return (
    <SessionProvider session={session}>
      <Layout>
        <Component {...pageProps} />
        <Toaster />
      </Layout>
    </SessionProvider>
  );
}

export default MyApp;
