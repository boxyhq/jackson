import type { AppProps } from 'next/app';
import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Toaster } from 'react-hot-toast';
import { appWithTranslation } from 'next-i18next';
import { AccountLayout, SetupLayout } from '@components/layouts';

import '../styles/globals.css';

function MyApp({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps<{
  session: Session;
}>) {
  const { pathname } = useRouter();
  if (pathname !== '/' && !pathname.startsWith('/admin')) {
    return (
      <SetupLayout>
        <Component {...pageProps} />
        <Toaster />
      </SetupLayout>
    );
  }

  return (
    <SessionProvider session={session}>
      <AccountLayout>
        <Component {...pageProps} />
        <Toaster />
      </AccountLayout>
    </SessionProvider>
  );
}

export default appWithTranslation<never>(MyApp);
