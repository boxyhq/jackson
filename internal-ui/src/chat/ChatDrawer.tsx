import MobileSidebar from './MobileSidebar';
import Sidebar from './Sidebar';
import { LLMConversation } from './types';

type ChatDrawerProps = {
  isChatDrawerVisible: boolean;
  toggleChatDrawerVisibility: () => void;
  setShowSettings: (value: boolean) => void;
  conversations?: LLMConversation[];
  conversationId?: string;
  setConversationId: (value: string) => void;
};

export default function ChatDrawer(props: ChatDrawerProps) {
  const {
    isChatDrawerVisible,
    toggleChatDrawerVisibility,
    setShowSettings,
    conversations,
    conversationId,
    setConversationId,
  } = props;
  return (
    <>
      {isChatDrawerVisible ? (
        <MobileSidebar
          toggleChatDrawerVisibility={toggleChatDrawerVisibility}
          setShowSettings={setShowSettings}
          conversations={conversations}
          conversationId={conversationId}
          setConversationId={setConversationId}
        />
      ) : null}
      <div className='dark hidden flex-shrink-0 bg-gray-900 md:flex md:w-[260px] md:flex-col'>
        <div className='flex h-full min-h-0 flex-col '>
          <Sidebar
            setShowSettings={setShowSettings}
            conversations={conversations}
            conversationId={conversationId}
            setConversationId={setConversationId}
          />
        </div>
      </div>
    </>
  );
}
