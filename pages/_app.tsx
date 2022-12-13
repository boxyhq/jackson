import type { AppProps } from 'next/app';
import type { Session } from 'next-auth';
import type { NextPage } from 'next';
import { SessionProvider } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Toaster } from 'react-hot-toast';
import { appWithTranslation } from 'next-i18next';
import { ReactElement, ReactNode } from 'react';
import micromatch from 'micromatch';

import { AccountLayout, SetupLayout } from '@components/layouts';

import '../styles/globals.css';

const unauthenticatedRoutes = [
  '/',
  '/admin/auth/login',
  '/well-known/saml-configuration',
  '/oauth/jwks',
  '/idp/select',
  '/error',
];

const isUnauthenticatedRoute = (pathname: string) => {
  return micromatch.isMatch(pathname, unauthenticatedRoutes);
};

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const { pathname } = useRouter();

  const { session, ...props } = pageProps;

  const getLayout = Component.getLayout;

  // If a page level layout exists, use it
  if (getLayout) {
    return (
      <>
        {getLayout(<Component {...props} />)}
        <Toaster toastOptions={{ duration: Infinity }} />
      </>
    );
  }

  if (pathname.startsWith('/setup/')) {
    return (
      <SetupLayout>
        <Component {...props} />
        <Toaster toastOptions={{ duration: Infinity }} />
      </SetupLayout>
    );
  }

  if (isUnauthenticatedRoute(pathname)) {
    return <Component {...props} />;
  }

  return (
    <SessionProvider session={session}>
      <AccountLayout>
        <Component {...props} />
        <Toaster toastOptions={{ duration: Infinity }} />
      </AccountLayout>
    </SessionProvider>
  );
}

export default appWithTranslation<never>(MyApp);

export type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
  pageProps: {
    session?: Session;
  };
};

export type NextPageWithLayout<P = Record<string, unknown>> = NextPage<P> & {
  getLayout?: (page: ReactElement) => ReactNode;
};
