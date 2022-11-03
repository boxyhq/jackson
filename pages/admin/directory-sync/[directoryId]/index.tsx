import type { NextPage, GetServerSidePropsContext } from 'next';
import React from 'react';
import jackson from '@lib/jackson';
import { inferSSRProps } from '@lib/inferSSRProps';
import DirectoryInfo from '@components/dsync/DirectoryInfo';

const Info: NextPage<inferSSRProps<typeof getServerSideProps>> = ({ directory }) => {
  return <DirectoryInfo directory={directory} />;
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
