import type { InferGetServerSidePropsType, GetServerSidePropsContext } from 'next';

import jackson from '@lib/jackson';
import DirectoryList from '@components/dsync/DirectoryList';

const Index = ({
  directories,
  pageOffset,
  pageLimit,
  providers,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  return (
    <DirectoryList
      directories={directories || []}
      pageOffset={pageOffset}
      pageLimit={pageLimit}
      providers={providers}
    />
  );
};

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const { offset = 0 } = context.query;
  const { directorySyncController } = await jackson();

  const pageOffset = parseInt(offset as string);
  const pageLimit = 25;
  const { data: directories } = await directorySyncController.directories.list({ pageOffset, pageLimit });

  return {
    props: {
      providers: directorySyncController.providers(),
      directories,
      pageOffset,
      pageLimit,
    },
  };
};

export default Index;
