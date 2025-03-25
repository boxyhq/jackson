import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import OnboardingClient from './onboarding-client';
import { GetServerSidePropsContext } from 'next';
import { useTranslation } from 'react-i18next';

export default function OnboardingPage() {
  const { t } = useTranslation('common');
  return (
    <div className='container mx-auto py-8'>
      <h1 className='text-3xl font-bold mb-6'>{t('integrated_onboarding')}</h1>
      <OnboardingClient />
    </div>
  );
}

export async function getStaticProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}
