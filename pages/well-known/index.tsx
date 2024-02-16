import { WellKnownURLs } from '@boxyhq/internal-ui';
import type { NextPage, GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const WellKnownURLsIndex: NextPage = () => {
  return (
    <div className='mx-auto max-w-5xl px-4 py-10'>
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
