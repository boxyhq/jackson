import React from 'react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';

import { Navbar } from '@components/Navbar';
import { Sidebar } from '@components/Sidebar';

export const AccountLayout = ({ children }: { children: React.ReactNode }) => {
  useSession({ required: true });

  return (
    <>
      <Head>
        <title>SAML Jackson - BoxyHQ</title>
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <Navbar />
      <div className='flex overflow-hidden pt-16'>
        <Sidebar />
        <div className='relative h-full w-full overflow-y-auto  lg:ml-64'>
          <main>
            <div className='flex w-full justify-center'>
              <div className='h-full w-full px-6 py-6'>{children}</div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};
