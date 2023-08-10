import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import remarkGfm from 'remark-gfm';
import { MDXRemote } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import type { GetServerSidePropsContext } from 'next';
import type { MDXRemoteSerializeResult } from 'next-mdx-remote';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import jackson from '@lib/jackson';
import { identityProviders } from '@lib/constants';
import Footer from '@components/setuplink-docs/Footer';
import type { ISPSAMLConfig } from '@boxyhq/saml-jackson';
import NextButton from '@components/setuplink-docs/NextButton';
import { InputWithCopyButton } from '@components/ClipboardButton';
import CreateConnection from '@components/connection/CreateConnection';
import PreviousButton from '@components/setuplink-docs/PreviousButton';
import SelectIdentityProviders from '@components/setuplink-docs/SelectIdentityProviders';

interface NewConnectionProps {
  idp: string;
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
  'prose-h2:text-xl',
  'prose-h2:font-medium',
  'prose-p:text-base',
  'prose-img:rounded',
  'prose-table:table',
  'prose-table:border',
];

const findIdp = (idp: string) => {
  return identityProviders.find((provider) => provider.id === idp);
};

const NewConnection = ({ idp, token, idpEntityId, source, spConfig }: NewConnectionProps) => {
  const scope = { token, idpEntityId, spConfig };
  const LinkSelectIdp = { pathname: '/setup/[token]/sso/new', query: { token } };
  let heading = '';

  if (idp) {
    const selectedIdP = findIdp(idp);
    heading = `Configure SAML SSO with ${selectedIdP?.name}`;
  } else {
    heading = 'Select Identity Provider';
  }

  return (
    <>
      <div className='flex justify-between items-center pb-6'>
        <h1 className='text-2xl font-bold'>{heading}</h1>
        {idp && (
          <Link className='btn btn-xs h-0' href={LinkSelectIdp}>
            <ArrowsRightLeftIcon className='w-5 h-5' />
            Change Identity Provider
          </Link>
        )}
      </div>

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

  const { tenant, product } = await setupLinkController.getByToken(token);
  const idpEntityId = connectionAPIController.getIDPEntityID({
    tenant,
    product,
  });

  let mdxSource: MDXRemoteSerializeResult<Record<string, unknown>> | null = null;

  // Read the MDX file based on the idp and step
  if (idp && step) {
    try {
      const mdxDirectory = path.join(process.cwd(), `components/setuplink-docs/${idp}`);
      const source = fs.readFileSync(`${mdxDirectory}/${step}.mdx`, 'utf8');
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
      idp: idp || null,
      token,
      idpEntityId,
      source: mdxSource,
      spConfig: await spConfig.get(),
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default NewConnection;
