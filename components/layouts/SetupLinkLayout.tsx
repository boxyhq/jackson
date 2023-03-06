import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import InvalidSetupLinkAlert from '@components/setup-link/InvalidSetupLinkAlert';
import Loading from '@components/Loading';
import useSetupLink from '@lib/ui/hooks/useSetupLink';
import usePortalBranding from '@lib/ui/hooks/usePortalBranding';
import { useTranslation } from 'next-i18next';
import { hexToHsl, darkenHslColor } from '@lib/color';
import { PoweredBy } from '@components/PoweredBy';

export const SetupLinkLayout = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation('common');
  const router = useRouter();

  const { token } = router.query as { token: string };

  const { branding } = usePortalBranding();
  const { setupLink, error, isLoading } = useSetupLink(token);

  if (isLoading) {
    return <Loading />;
  }

  const primaryColor = branding?.primaryColor ? hexToHsl(branding?.primaryColor) : null;
  const title =
    setupLink?.service === 'sso'
      ? t('configure_sso')
      : setupLink?.service === 'dsync'
      ? t('configure_dsync')
      : null;

  return (
    <>
      <Head>
        <title>{`${title} - ${branding?.companyName}`}</title>
        {branding?.faviconUrl && <link rel='icon' href={branding.faviconUrl} />}
      </Head>

      {primaryColor && (
        <style>{`:root { --p: ${primaryColor}; --pf: ${darkenHslColor(primaryColor, 30)}; }`}</style>
      )}

      <div className='flex flex-1 flex-col'>
        <div className='sticky top-0 z-10 flex h-16 flex-shrink-0 border-b bg-white'>
          <div className='flex flex-shrink-0 items-center px-4'>
            <Link href={`/setup/${token}`}>
              <div className='flex items-center'>
                {branding?.logoUrl && (
                  <Image src={branding.logoUrl} alt={branding.companyName} width={42} height={42} />
                )}
                <span className='ml-4 text-xl font-bold text-gray-900'>{title}</span>
              </div>
            </Link>
          </div>
        </div>
        <main>
          <div className='py-6'>
            <div className='mx-auto max-w-7xl px-4 sm:px-6 md:px-8'>
              {error && <InvalidSetupLinkAlert message={error.message} />}
              {setupLink && children}
            </div>
          </div>
        </main>
      </div>
      <PoweredBy />
    </>
  );
};
