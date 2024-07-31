import { ChatContextProvider, ChatUI } from '@boxyhq/internal-ui';
import { llmOptions } from '@lib/env';
import type { GetServerSidePropsContext, InferGetServerSidePropsType, NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const ChatPage: NextPage<InferGetServerSidePropsType<typeof getServerSideProps>> = ({ llmTenant }) => {
  return (
    <ChatContextProvider
      value={{
        urls: {
          chat: `/api/admin/chat/${llmTenant}`,
          llmConfig: `/api/admin/chat/${llmTenant}/config`,
          llmProviders: `/api/admin/chat/${llmTenant}/providers`,
          fileUpload: `/api/admin/chat/${llmTenant}/file-upload`,
          conversation: `/api/admin/chat/${llmTenant}/conversation`,
        },
      }}>
      <ChatUI />
    </ChatContextProvider>
  );
};

export async function getServerSideProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
      llmTenant: llmOptions.adminPortalTenant,
    },
  };
}

export default ChatPage;
