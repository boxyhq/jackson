import { llmOptions } from '@lib/env';
import type { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import jackson from '@lib/jackson';

export { default } from '@ee/chat/pages/[[...conversationId]]';

export async function getServerSideProps({ locale }: GetServerSidePropsContext) {
  const { checkLicense } = await jackson();

  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
      llmTenant: llmOptions.adminPortalTenant,
      hasValidLicense: await checkLicense(),
    },
  };
}
