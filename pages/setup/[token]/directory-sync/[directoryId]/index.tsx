import type { NextPage, GetServerSidePropsContext } from 'next';
import React from 'react';
import jackson from '@lib/jackson';
import { inferSSRProps } from '@lib/inferSSRProps';
import { useRouter } from 'next/router';
import DirectoryInfo from '@components/dsync/DirectoryInfo';

const Info: NextPage<inferSSRProps<typeof getServerSideProps>> = ({ directory }) => {
  const router = useRouter();
  const { token } = router.query;
  return <DirectoryInfo directory={directory} token={token as string} />;
};

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const { directoryId } = context.query;
  const { directorySyncController } = await jackson();

  const { data: directory } = await directorySyncController.directories.get(directoryId as string);

  if (!directory) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      directory,
    },
  };
};

export default Info;
