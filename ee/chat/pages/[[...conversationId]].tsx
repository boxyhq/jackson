import { ChatContextProvider, ChatUI } from '@boxyhq/internal-ui';
import LicenseRequired from '@components/LicenseRequired';

const ChatPage = ({ llmTenant, hasValidLicense }: { llmTenant: string; hasValidLicense: boolean }) => {
  if (!hasValidLicense) {
    return <LicenseRequired />;
  }

  return (
    <ChatContextProvider
      value={{
        urls: {
          chat: `/api/admin/llm-vault/chat/${llmTenant}`,
          llmConfig: `/api/admin/llm-vault/chat/${llmTenant}/config`,
          llmProviders: `/api/admin/llm-vault/chat/${llmTenant}/providers`,
          fileUpload: `/api/admin/llm-vault/chat/${llmTenant}/upload-file`,
          conversation: `/api/admin/llm-vault/chat/${llmTenant}/conversation`,
        },
      }}>
      <ChatUI />
    </ChatContextProvider>
  );
};

export default ChatPage;
