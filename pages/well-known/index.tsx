import { WellKnownURLs } from '@boxyhq/internal-ui/well-known';
import type { NextPage, GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const WellKnownURLsIndex: NextPage = () => {
  return (
    <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10'>
      <WellKnownURLs />
    </div>
  );
};

export async function getStaticProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default WellKnownURLsIndex;
