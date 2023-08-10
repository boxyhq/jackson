import fs from 'fs';
import remarkGfm from 'remark-gfm';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import type { GetServerSidePropsContext } from 'next';
import type { MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import jackson from '@lib/jackson';
import Footer from '@components/setuplink-docs/Footer';
import type { ISPSAMLConfig } from '@boxyhq/saml-jackson';
import NextButton from '@components/setuplink-docs/NextButton';
import { InputWithCopyButton } from '@components/ClipboardButton';
import CreateConnection from '@components/connection/CreateConnection';
import PreviousButton from '@components/setuplink-docs/PreviousButton';
import SelectIdentityProviders from '@components/setuplink-docs/SelectIdentityProviders';

interface NewConnectionProps {
  token: string;
  idpEntityId: string;
  spConfig: Awaited<ReturnType<ISPSAMLConfig['get']>>;
  source: MDXRemoteSerializeResult<Record<string, unknown>>;
}

const components = {
  Footer,
  NextButton,
  PreviousButton,
  CreateConnection,
  InputWithCopyButton,
};

const proseClassNames = [
  'prose',
  'prose-sm',
  'prose-h1:text-2xl',
  'prose-h1:font-medium',
  'prose-p:text-base',
  'prose-img:rounded',
  'prose-table:table',
  'prose-table:border',
];

const NewConnection = ({ token, idpEntityId, source, spConfig }: NewConnectionProps) => {
  const scope = { token, idpEntityId, spConfig };

  return (
    <>
      <article className={`${proseClassNames.join(' ')} max-w-4xl`}>
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
  const { spConfig, setupLinkController, connectionAPIController } = await jackson();
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

  const { tenant, product } = await setupLinkController.getByToken(token);

  const idpEntityId = connectionAPIController.getIDPEntityID({
    tenant,
    product,
  });

  return {
    props: {
      token,
      idpEntityId,
      source: mdxSource,
      spConfig: await spConfig.get(),
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default NewConnection;
