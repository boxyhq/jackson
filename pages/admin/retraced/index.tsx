import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { retracedOptions } from '@lib/env';
import { EmptyState, Loading } from '@boxyhq/internal-ui';

export interface Props {
  host?: string;
}

const Retraced: NextPage<Props> = ({ host }: Props) => {
  const router = useRouter();

  useEffect(() => {
    if (!host) {
      return;
    }
    router.push('/admin/retraced/projects');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  if (!host) {
    return (
      <EmptyState
        title='This feature has not been enabled.'
        description='Please add the host for our Audit Logs service to enable this feature.'
      />
    );
  }

  return <Loading />;
};

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
      host: retracedOptions.externalUrl || null,
    },
  };
}

export default Retraced;
