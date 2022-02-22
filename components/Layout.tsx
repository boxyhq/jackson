import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import Logo from '../public/logo.png';
import { LogoutIcon, MenuIcon, ShieldCheckIcon } from '@heroicons/react/outline';
import useOnClickOutside from 'hooks/useOnClickOutside';
import ActiveLink from './ActiveLink';
import useKeyPress from 'hooks/useKeyPress';
import useMediaQuery from 'hooks/useMediaQuery';
import { useSession, signOut } from 'next-auth/react';

const navigation = [
  {
    path: '/admin/saml/config',
    text: <span className='ml-4'>SAML Configurations</span>,
    icon: <ShieldCheckIcon className='w-5 h-5' aria-hidden />,
  },
];

function Layout({ children }: { children: ReactNode }) {
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

  // check logged-in status, https://next-auth.js.org/getting-started/client#require-session
  // The default behavior is to redirect the user to the sign-in page, from where - after a successful login - they will be sent back to the page they started on.
  const { data: session, status } = useSession({ required: true });

  // user settings dropdown state
  const [isOpen, setIsOpen] = useState(false);
  const userDropDownRef = useRef(null);
  useOnClickOutside(userDropDownRef, () => setIsOpen(false));

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  return (
    <>
      <Head>
        <title>Jackson SAML Dashboard</title>
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <header
        role='banner'
        className='fixed left-0 right-0 z-10 p-5 bg-white border-b md:px-12 dark:bg-gray-900 border-gray-900/10 dark:border-gray-300/10'>
        <div className='flex items-center justify-between'>
          <Link href='/'>
            <a title='Go to dashboard' className='flex items-center ml-10 font-bold leading-10 md:ml-0'>
              <Image src={Logo} alt='BoxyHQ' layout='fixed' width={36} height={36} />
              <h1 className='ml-2 text-secondary hover:text-primary dark:text-white'>Jackson</h1>
            </a>
          </Link>
          <div className='relative'>
            <button
              type='button'
              className='flex items-center justify-center w-8 h-8 uppercase rounded-full bg-secondary text-cyan-50'
              aria-label='user settings'
              aria-expanded={isOpen}
              onClick={() => setIsOpen(!isOpen)}>
              {session?.user?.name?.[0]}
            </button>
            {isOpen && (
              <ul
                className='absolute right-0 z-50 py-1 overflow-hidden text-sm font-semibold bg-white rounded-lg shadow-lg top-full ring-1 ring-slate-900/10 w-36 text-slate-700 dark:bg-slate-800 dark:ring-0 dark:highlight-white/5 dark:text-slate-300'
                ref={userDropDownRef}>
                <li>
                  <button
                    type='button'
                    className='flex items-center justify-center w-full h-8 px-2 py-1 cursor-pointer'
                    onClick={() => signOut()}>
                    <LogoutIcon className='w-5 h-5' aria-hidden />
                    Log out
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>
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
            <MenuIcon aria-hidden='true' className='w-6 h-6 text-black dark:text-slate-50'></MenuIcon>
          </button>
          <ul
            className={`fixed top-0 bottom-0 left-0 w-60 p-6 border-r border-gray-900/10 dark:border-gray-300/10 transition-transform ${
              isSideNavOpen ? 'translate-x-0' : '-translate-x-full'
            } md:translate-x-0 md:top-20 md:translate-y-[2px] bg-white dark:bg-gray-900`}
            id='menu'
            ref={ref}>
            {navigation.map(({ path, text, icon }, index) => (
              <li key={index}>
                <ActiveLink href={path} activeClassName='text-primary/90 dark:text-sky-400 font-semibold'>
                  <a className='link-primary'>
                    {icon}
                    {text}
                  </a>
                </ActiveLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main
        role='main'
        className='relative top-[81px] h-[calc(100%_-_81px)] md:left-60 md:w-[calc(100%_-_theme(space.60))] p-6 overflow-auto'>
        {children}
      </main>
      {/* <footer role="contentinfo">
        <p>&copy; 2022 BoxyHQ, Inc.</p>
      </footer> */}
    </>
  );
}

export default Layout;
