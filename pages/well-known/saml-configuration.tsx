import type { NextPage, InferGetStaticPropsType } from 'next';
import { serialize } from 'next-mdx-remote/serialize';
import { MDXRemote } from 'next-mdx-remote';

import jackson from '@lib/jackson';
import React from 'react';

const SPConfig: NextPage<InferGetStaticPropsType<typeof getServerSideProps>> = ({ content }) => {
  return (
    <>
      <div className='my-10 mx-5 flex h-screen justify-center'>
        <article className='prose-md prose'>
          <MDXRemote {...content} />
        </article>
      </div>
    </>
  );
};

export const getServerSideProps = async () => {
  const { spConfig } = await jackson();

  return {
    props: {
      content: await serialize(spConfig.toMarkdown()),
    },
  };
};

export default SPConfig;
