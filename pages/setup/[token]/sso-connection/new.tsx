import type { NextPage, GetServerSidePropsContext, GetStaticPaths } from 'next';
import Add from '@components/connection/Add';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import { fetcher } from '@lib/ui/utils';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const NewConnection: NextPage = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { token } = router.query;
  const { data: setup } = useSWR<any>(token ? `/api/setup/${token}` : null, fetcher, {
    revalidateOnFocus: false,
  });
  const { data: boxyhqEntityID } = useSWR<any>(
    token ? `/api/setup/${token}/connections/idp-entityid` : null,
    fetcher,
    { revalidateOnFocus: false }
  );
  if (!token || !setup) {
    return null;
  } else {
    return (
      <Add
        setup={{
          ...setup,
          token,
        }}
        boxyhqEntityID={boxyhqEntityID}
      />
    );
  }
};

export default NewConnection;

export async function getStaticProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export const getStaticPaths: GetStaticPaths<{ slug: string }> = async () => {
  return {
    paths: [], //indicates that no page needs be created at build time
    fallback: 'blocking', //indicates the type of fallback
  };
};
