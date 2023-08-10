import fs from 'fs';
import remarkGfm from 'remark-gfm';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import type { GetServerSidePropsContext } from 'next';
import NextButton from '@components/setuplink-docs/NextButton';
import type { MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import jackson from '@lib/jackson';
import type { ISPSAMLConfig } from '@boxyhq/saml-jackson';
import { InputWithCopyButton } from '@components/ClipboardButton';
import SelectIdentityProviders from '@components/setuplink-docs/SelectIdentityProviders';

interface NewConnectionProps {
  spConfig: Awaited<ReturnType<ISPSAMLConfig['get']>>;
  source: MDXRemoteSerializeResult<Record<string, unknown>>;
}

const components = {
  NextButton,
  InputWithCopyButton,
};

const NewConnection = ({ source, spConfig }: NewConnectionProps) => {
  const scope = {
    spConfig,
  };

  return (
    <>
      <article className='prose prose-sm max-w-4xl prose-p:text-base prose-img:rounded prose-table:table prose-table:border'>
        {source ? (
          <MDXRemote {...source} components={components} scope={scope} />
        ) : (
          <SelectIdentityProviders />
        )}
      </article>
    </>
  );
};

export async function getServerSideProps({ locale, query }: GetServerSidePropsContext) {
  const { spConfig } = await jackson();
  const { idp, step, token } = query as { idp: string; step: string; token: string };

  let mdxSource: MDXRemoteSerializeResult<Record<string, unknown>> | null = null;

  // Read the MDX file based on the idp and step
  if (idp && step) {
    try {
      const stepFile = `components/setuplink-docs/${idp}/${step}.mdx`;
      const source = fs.readFileSync(stepFile, 'utf8');
      mdxSource = await serialize(source, { mdxOptions: { remarkPlugins: [remarkGfm] } });
    } catch (error: any) {
      return {
        redirect: {
          destination: `/setup/${token}/sso/new`,
        },
      };
    }
  }

  return {
    props: {
      source: mdxSource,
      spConfig: await spConfig.get(),
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default NewConnection;
