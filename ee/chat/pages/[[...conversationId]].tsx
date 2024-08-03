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
          chat: `/api/admin/chat/${llmTenant}`,
          llmConfig: `/api/admin/chat/${llmTenant}/config`,
          llmProviders: `/api/admin/chat/${llmTenant}/providers`,
          fileUpload: `/api/admin/chat/${llmTenant}/upload-file`,
          conversation: `/api/admin/chat/${llmTenant}/conversation`,
        },
      }}>
      <ChatUI />
    </ChatContextProvider>
  );
};

export default ChatPage;
