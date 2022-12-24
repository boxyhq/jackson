import type { InferGetServerSidePropsType, GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import jackson from '@lib/jackson';
import DirectoryList from '@components/dsync/DirectoryList';
import { useState } from 'react';

const Index = ({ directories }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter();
  const [paginate, setPaginate] = useState({ offset: 0 });

  const { token } = router.query as { token: string };

  return (
    <DirectoryList directories={directories} token={token} paginate={paginate} setPaginate={setPaginate} />
  );
};

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const { offset = 0, token } = context.query;
  const { directorySyncController, setupLinkController } = await jackson();
  const { locale }: GetServerSidePropsContext = context;
  let directories;
  if (!token) {
    directories = [];
  } else {
    const { data: setup, error: err } = await setupLinkController.getByToken(token);
    if (err) {
      directories = [];
    } else if (!setup) {
      directories = [];
    } else if (setup?.validTill < +new Date()) {
      directories = [];
    } else {
      const { data } = await directorySyncController.directories.getByTenantAndProduct(
        setup.tenant,
        setup.product
      );
      directories = data ? [data] : [];
    }
  }
  const pageOffset = parseInt(offset as string);
  const pageLimit = 25;
  return {
    props: {
      providers: directorySyncController.providers(),
      directories,
      pageOffset,
      pageLimit,
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
};

export default Index;
