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
import { hexToOklch } from '@lib/color';
import { PoweredBy } from '@components/PoweredBy';

export const SetupLinkLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { t } = useTranslation('common');

  const { token } = router.query as { token: string };

  const { setupLink, error, isLoading } = useSetupLink(token);
  const { branding, isLoading: isLoadingBranding } = usePortalBranding(setupLink?.product);

  if (isLoading || isLoadingBranding) {
    return <Loading />;
  }

  const titles = {
    sso: t('configure_sso'),
    dsync: t('configure_dsync'),
  };

  const title = setupLink?.service ? titles[setupLink?.service] : '';

  return (
    <>
      <Head>
        <title>{`${title} - ${branding?.companyName}`}</title>
        {branding?.faviconUrl && <link rel='icon' href={branding.faviconUrl} />}
      </Head>

      {branding?.primaryColor && <style>{`:root { --p: ${hexToOklch(branding.primaryColor)}; }`}</style>}

      <div className='mx-auto max-w-3xl'>
        <div className='flex flex-1 flex-col'>
          <div className='top-0 flex h-16 flex-shrink-0 border-b'>
            <div className='flex flex-shrink-0 items-center gap-4'>
              <Link href={`/setup/${token}`}>
                {branding?.logoUrl && (
                  <Image src={branding.logoUrl} alt={branding.companyName} width={40} height={40} />
                )}
              </Link>
              <span className='text-xl font-bold tracking-wide text-gray-900'>{title}</span>
            </div>
          </div>
          <main>
            <div className='py-6'>
              {error && <InvalidSetupLinkAlert message={error.message} />}
              {setupLink && children}
            </div>
          </main>
        </div>
      </div>
      <PoweredBy />
    </>
  );
};
