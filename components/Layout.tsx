import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import Logo from '../public/logo.png';
import { CollectionIcon, MenuIcon, ShieldCheckIcon, UserIcon } from '@heroicons/react/outline';
import useOnClickOutside from 'hooks/useOnClickOutside';
import ActiveLink from './ActiveLink';
import useKeyPress from 'hooks/useKeyPress';
import useMediaQuery from 'hooks/useMediaQuery';

const navigation = [
  {
    path: '/admin',
    text: <span className='ml-4'>Dashboard</span>,
    icon: <CollectionIcon className='w-5 h-5' aria-hidden />,
  },
  {
    path: '/admin/oauth/clients',
    text: <span className='ml-4'>OAuth clients</span>,
    icon: <ShieldCheckIcon className='w-5 h-5' aria-hidden />,
  },
  {
    path: '/admin/account',
    text: <span className='mx-4'>Account</span>,
    icon: <UserIcon className='w-5 h-5' aria-hidden />,
  },
];

export default function Layout({ children }: { children: ReactNode }) {
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
  const ref = useRef(null);

  const _closeSideNav = useCallback(() => {
    if (isSideNavOpen) {
      setIsSideNavOpen(false);
    }
  }, [isSideNavOpen]);

  // close on clicking outside
  useOnClickOutside(ref, _closeSideNav);
  // close on "Escape" key press
  const pressedEsc = useKeyPress('Escape');
  useEffect(() => {
    if (pressedEsc) {
      _closeSideNav();
    }
  }, [_closeSideNav, pressedEsc]);
  // reset state on window resize
  /*IMPORTANT: matches the md breakpoint default setting at https://tailwindcss.com/docs/screens*/
  const _mdBreakpointMatch = useMediaQuery('(min-width: 768px)');
  useEffect(() => {
    if (_mdBreakpointMatch) {
      _closeSideNav();
    }
  }, [_closeSideNav, _mdBreakpointMatch]);

  return (
    <>
      <Head>
        <title>Jackson SAML Dashboard</title>
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <header
        role='banner'
        className='p-5 md:px-12 relative border-b border-gray-900/10 dark:border-gray-300/10'>
        <Link href='/'>
          <a title='Go to dashboard' className='leading-10 font-bold flex items-center ml-10 md:ml-0'>
            <Image src={Logo} alt='BoxyHQ' layout='fixed' width={36} height={36} />
            <h1 className='ml-2 text-gray-900 dark:text-white'>Jackson</h1>
          </a>
        </Link>
        {isSideNavOpen && (
          <div
            className='fixed inset-0 bg-black/20 backdrop-blur-sm dark:bg-gray-900/80 md:hidden'
            id='headlessui-dialog-overlay-14'
            aria-hidden='true'></div>
        )}
        <nav role='navigation'>
          <button
            className={`w-10 h-10 inline-flex items-center justify-center absolute top-5 md:hidden`}
            aria-expanded={isSideNavOpen}
            aria-controls='menu'
            onClick={() => setIsSideNavOpen((curState) => !curState)}>
            <span className='sr-only'>Menu</span>
            <MenuIcon aria-hidden='true' className='h-6 w-6 text-black dark:text-slate-50'></MenuIcon>
          </button>
          <ul
            className={`fixed top-0 bottom-0 left-0 w-60 p-6 border-r border-gray-900/10 dark:border-gray-300/10 transition-transform ${
              isSideNavOpen ? 'translate-x-0' : '-translate-x-full'
            } md:translate-x-0 md:top-20 md:translate-y-[2px] bg-white dark:bg-gray-900 z-10`}
            id='menu'
            ref={ref}>
            {navigation.map(({ path, text, icon }, index) => (
              <li key={index}>
                <ActiveLink href={path} activeClassName='text-sky-500 dark:text-sky-400 font-semibold'>
                  <a className='flex items-center px-4 py-2 mt-2 md:text-sm md:leading-6 text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 font-medium'>
                    {icon}
                    {text}
                  </a>
                </ActiveLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main role='main' className='relative md:left-60 md:w-[calc(100%_-_theme(space.60))]'>
        {children}
      </main>
      {/* <footer role="contentinfo">
        <p>&copy; 2022 BoxyHQ, Inc.</p>
      </footer> */}
    </>
  );
}
