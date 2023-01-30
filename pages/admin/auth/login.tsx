import { useState, type ReactElement } from 'react';
import type { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, getCsrfToken, signIn, SessionProvider } from 'next-auth/react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { errorToast, successToast } from '@components/Toaster';
import { ButtonOutline } from '@components/ButtonOutline';
import Loading from '@components/Loading';
import { Login as SSOLogin } from '@boxyhq/react-ui';
import { adminPortalSSODefaults } from '@lib/env';

const Login = ({ csrfToken, tenant, product }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { status } = useSession();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');

  if (status === 'loading') {
    return <Loading />;
  }

  if (status === 'authenticated') {
    router.push('/admin/sso-connection');
    return;
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
      errorToast(error);
    } else {
      successToast(t('login_success_toast'));
    }
  };

  const onSSOSubmit = async (ssoIdentifier: string) => {
    await signIn('boxyhq-saml', undefined, { client_id: ssoIdentifier });
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
                        placeholder={t('email')}
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
                  <ButtonOutline type='submit' loading={loading} className='btn-block'>
                    {t('send_magic_link')}
                  </ButtonOutline>
                </div>
              </div>
            </form>
            <SSOLogin
              buttonText={t('login_with_sso')}
              ssoIdentifier={`tenant=${tenant}&product=${product}`}
              onSubmit={onSSOSubmit}
              classNames={{
                container: 'mt-2',
                button: 'btn-outline btn-block btn',
              }}
              innerProps={{
                button: { 'data-testid': 'sso-login-button' },
              }}
            />
          </div>
        </div>
        <Link href='/.well-known' className='my-3 text-sm underline' target='_blank'>
          {t('here_are_the_set_of_uris_you_would_need_access_to')}
        </Link>
      </div>
    </>
  );
};

Login.getLayout = function getLayout(page: ReactElement) {
  return <SessionProvider>{page}</SessionProvider>;
};

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const { locale }: GetServerSidePropsContext = context;
  const { tenant, product } = adminPortalSSODefaults;
  return {
    props: {
      csrfToken: await getCsrfToken(context),
      tenant,
      product,
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
};

export default Login;
