import type { GetServerSidePropsContext, NextPage } from 'next';
import LinkList from '@components/setup-link/LinkList';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import useSWR from 'swr';
import { fetcher } from '@lib/ui/utils';
import { useState } from 'react';
import { deleteLink, regenerateLink } from '@components/connection/utils';

const service = 'sso';

const SetupLinks: NextPage = () => {
  const [paginate, setPaginate] = useState({ pageOffset: 0, pageLimit: 20, page: 0 });
  const { data: setupLinks } = useSWR<any>([`/api/admin/setup-links?service=sso`], fetcher, {
    revalidateOnFocus: false,
  });
  
  
  return (
    <LinkList
      paginate={paginate}
      setPaginate={setPaginate}
      links={setupLinks?.data}
      service={service}
      deleteLink={deleteLink}
      regenerateLink={regenerateLink}
    />
  );
};

export async function getStaticProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default SetupLinks;
