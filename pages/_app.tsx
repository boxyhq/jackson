import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { useRouter } from 'next/router';

import { AccountLayout } from '@components/layouts';

import '../styles/globals.css';

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const { pathname } = useRouter();

  if (pathname !== '/' && !pathname.startsWith('/admin')) {
    return <Component {...pageProps} />;
  }

  return (
    <SessionProvider session={session}>
      <AccountLayout>
        <Component {...pageProps} />
      </AccountLayout>
    </SessionProvider>
  );
}

export default MyApp;
