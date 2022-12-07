import type { ReactElement } from 'react';
import type { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import { useSession, getCsrfToken, signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { SessionProvider } from 'next-auth/react';
import { useState } from 'react';
import classNames from 'classnames';

import WellKnownURLs from '@components/connection/WellKnownURLs';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const Login = ({ csrfToken }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { status } = useSession();

  const [loading, setLoading] = useState(false);
  const [loadingSSO, setLoadingSSO] = useState(false);
  const [email, setEmail] = useState('');

  if (status === 'authenticated') {
    router.push('/admin/connection');
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);

    const response = await signIn('email', {
      email,
      csrfToken,
      redirect: false,
    });

    setLoading(false);

    if (!response) {
      return;
    }

    const { error } = response;

    if (error) {
      toast.error(error);
      return;
    }

    toast.success(t('login_success_toast'));
  };

  return (
    <>
      <div className='flex min-h-screen flex-col items-center justify-center'>
        <div className='flex flex-col'>
          <div className='mt-4 border p-6 text-left shadow-md'>
            <div className='space-y-3'>
              <div className='flex justify-center'>
                <Image src='/logo.png' alt='BoxyHQ logo' width={50} height={50} />
              </div>
              <h2 className='text-center text-3xl font-extrabold text-gray-900'>BoxyHQ Admin Portal</h2>
              <p className='text-center text-sm text-gray-600'>
                {t('enterprise_readiness_for_b2b_saas_straight_out_of_the_box')}
              </p>
            </div>
            <form onSubmit={onSubmit}>
              <div className='mt-8'>
                <div>
                  <label className='block' htmlFor='email'>
                    {t('email')}
                    <label>
                      <input
                        type='email'
                        placeholder='Email'
                        className='input-bordered input mb-5 mt-2 w-full rounded-md'
                        required
                        onChange={(e) => {
                          setEmail(e.target.value);
                        }}
                        value={email}
                      />
                    </label>
                  </label>
                </div>
                <div className='flex items-baseline justify-between'>
                  <button
                    className={classNames('btn-primary btn-block btn rounded-md', loading ? 'loading' : '')}
                    type='submit'>
                    {t('send_magic_link')}
                  </button>
                </div>
                <div className='mt-2 flex items-baseline justify-between'>
                  <button
                    className={classNames(
                      'btn-primary btn-block btn rounded-md',
                      loadingSSO ? 'loading' : ''
                    )}
                    type='button'>
                    {t('login_with_sso')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
        <WellKnownURLs className='mt-5 border p-5' />
      </div>
    </>
  );
};

Login.getLayout = function getLayout(page: ReactElement) {
  return <SessionProvider>{page}</SessionProvider>;
};

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const { locale }: GetServerSidePropsContext = context;
  return {
    props: {
      csrfToken: await getCsrfToken(context),
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
      // Will be passed to the page component as props
    },
  };
};

export default Login;
