import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import Logo from '../public/logo.png';
import { LogoutIcon, MenuIcon, ShieldCheckIcon, UsersIcon, SupportIcon } from '@heroicons/react/outline';
import ActiveLink from './ActiveLink';
import useOnClickOutside from '@lib/ui/hooks/useOnClickOutside';
import useKeyPress from '@lib/ui/hooks/useKeyPress';
import useMediaQuery from '@lib/ui/hooks/useMediaQuery';
import { useSession, signOut } from 'next-auth/react';

const navigation = [
  {
    path: '/admin/saml/config',
    text: <span className='ml-4'>SAML Configurations</span>,
    icon: <ShieldCheckIcon className='h-5 w-5' aria-hidden />,
  },

  {
    path: '/admin/directory-sync',
    text: <span className='ml-4'>Directory Sync</span>,
    icon: <UsersIcon className='h-5 w-5' aria-hidden />,
  },

  {
    path: 'https://boxyhq.com/docs',
    text: <span className='ml-4'>Docs</span>,
    icon: <SupportIcon className='h-5 w-5' aria-hidden />,
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
    return null;
  }

  return (
    <>
      <Head>
        <title>Jackson SAML Dashboard</title>
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <header
        role='banner'
        className='fixed left-0 right-0 z-10 border-b border-gray-900/10 bg-white p-5 dark:border-gray-300/10 dark:bg-gray-900 md:px-12'>
        <div className='flex items-center justify-between'>
          <Link href='/'>
            <a title='Go to dashboard' className='ml-10 flex items-center font-bold leading-10 md:ml-0'>
              <Image src={Logo} alt='BoxyHQ' layout='fixed' width={36} height={36} />
              <h1 className='ml-2 text-secondary hover:text-primary dark:text-white'>SAML Jackson</h1>
            </a>
          </Link>
          <div className='relative'>
            <button
              type='button'
              className='flex h-8 w-8 items-center justify-center rounded-full bg-secondary uppercase text-cyan-50'
              aria-label='user settings'
              aria-expanded={isOpen}
              onClick={() => setIsOpen(!isOpen)}>
              {session?.user?.name?.[0]}
            </button>
            {isOpen && (
              <ul
                className='dark:highlight-white/5 absolute right-0 top-full z-50 w-36 overflow-hidden rounded-lg bg-white py-1 text-sm font-semibold text-slate-700 shadow-lg ring-1 ring-slate-900/10 dark:bg-slate-800 dark:text-slate-300 dark:ring-0'
                ref={userDropDownRef}>
                <li>
                  <button
                    type='button'
                    className='flex h-8 w-full cursor-pointer items-center justify-center px-2 py-1'
                    onClick={() => signOut()}>
                    <LogoutIcon className='h-5 w-5' aria-hidden />
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
            className={`absolute top-5 inline-flex h-10 w-10 items-center justify-center md:hidden`}
            aria-expanded={isSideNavOpen}
            aria-controls='menu'
            onClick={() => setIsSideNavOpen((curState) => !curState)}>
            <span className='sr-only'>Menu</span>
            <MenuIcon aria-hidden='true' className='h-6 w-6 text-black dark:text-slate-50'></MenuIcon>
          </button>
          <ul
            className={`fixed top-0 bottom-0 left-0 w-60 border-r border-gray-900/10 p-6 transition-transform dark:border-gray-300/10 ${
              isSideNavOpen ? 'translate-x-0' : '-translate-x-full'
            } bg-white dark:bg-gray-900 md:top-20 md:translate-x-0 md:translate-y-[2px]`}
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
        className='relative top-[81px] h-[calc(100%_-_81px)] overflow-auto p-6 md:left-60 md:w-[calc(100%_-_theme(space.60))]'>
        {children}
      </main>
    </>
  );
}

export default Layout;
