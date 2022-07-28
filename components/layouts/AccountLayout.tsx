import React from 'react';

import { Navbar } from '@components/Navbar';
import { Sidebar } from '@components/Sidebar';

export const AccountLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Navbar />
      <div className='flex overflow-hidden pt-16'>
        <Sidebar />
        <div className='relative h-full w-full overflow-y-auto  lg:ml-64'>
          <main>
            <div className='flex h-screen w-full justify-center'>
              <div className='w-3/4 px-6 py-6 '>{children}</div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};
