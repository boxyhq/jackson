import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';

import { AccountLayout } from '@components/layouts';

import '../styles/globals.css';

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <AccountLayout>
        <Component {...pageProps} />
      </AccountLayout>
    </SessionProvider>
  );
}

export default MyApp;
