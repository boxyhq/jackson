import type { Session } from 'next-auth';
import React from 'react';
import { signOut } from 'next-auth/react';
import classNames from 'classnames';
import { useTranslation } from 'next-i18next';

export const Navbar = ({ session }: { session: Session | null }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { t } = useTranslation('common');

  return (
    <div className='flex flex-1 justify-between px-4'>
      <div className='flex flex-1'></div>
      <div className='ml-4 flex items-center md:ml-6'>
        <div className='relative ml-3'>
          <div>
            <button
              type='button'
              className='flex h-8 w-8 items-center justify-center rounded-full bg-secondary uppercase text-cyan-50 focus:outline-none'
              aria-expanded='false'
              aria-haspopup='true'
              onClick={() => {
                setIsOpen(!isOpen);
              }}>
              <span className='sr-only'>{t('open_menu')}</span>
              {session?.user?.name?.[0]}
            </button>
          </div>
          <div
            className={classNames(
              'absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none',
              { hidden: !isOpen }
            )}
            role='menu'
            aria-orientation='vertical'
            aria-labelledby='user-menu-button'
            tabIndex={-1}>
            <a
              className='block px-4 py-2 text-sm text-gray-700'
              role='menuitem'
              tabIndex={-1}
              id='user-menu-item-2'
              onClick={() => signOut()}>
              {t('sign_out')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
