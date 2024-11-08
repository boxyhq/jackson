import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';

import { Sidebar } from '@components/Sidebar';
import { Navbar } from '@components/Navbar';
import { useTranslation } from 'next-i18next';
import { Loading } from '@boxyhq/internal-ui';

export const AccountLayout = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation('common');
  const { data: session, status } = useSession({ required: true });

  const [isOpen, setIsOpen] = useState(true);
  const [branding, setBranding] = useState<any>(null);

  useEffect(() => {
    const fetchBrandingInfo = async () => {
      try {
        // Replace this with your actual API call
        const response = await fetch('/api/branding');
        const data = await response.json();
        setBranding(data.data);
      } catch (error) {
        console.error('Error fetching branding info:', error);
      }
    };

    fetchBrandingInfo();
  }, []);

  if (status === 'loading') {
    return <Loading />;
  }

  return (
    <>
      <Head>
        <title>{(branding ? branding.companyName : 'BoxyHQ') + ' ' + t('admin_portal')}</title>
        <link rel='icon' href={branding ? branding.faviconUrl : '/favicon.ico'} />
      </Head>
      <div className='flex h-full'>
        <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} branding={branding} />
        <div className='flex flex-1 flex-col w-[calc(100%-16rem)]'>
          <div className='sticky top-0 z-10 flex h-16 flex-shrink-0 border-b bg-white'>
            {!isOpen && (
              <button
                onClick={() => {
                  setIsOpen(!isOpen);
                }}
                type='button'
                className='border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset '>
                <span className='sr-only'>{t('open_sidebar')}</span>
                <svg
                  className='h-6 w-6'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth={2}
                  stroke='currentColor'
                  aria-hidden='true'>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M4 6h16M4 12h16M4 18h7' />
                </svg>
              </button>
            )}
            <Navbar session={session} />
          </div>
          <main className='h-[calc(100vh-4rem)] overflow-auto'>
            <div className='py-6 h-full'>
              <div className='mx-auto px-4 h-full'>{children}</div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};
