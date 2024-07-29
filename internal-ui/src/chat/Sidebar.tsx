import { useTranslation } from 'next-i18next';
import { PlusIcon, ChatBubbleLeftEllipsisIcon, CogIcon } from '@heroicons/react/24/outline';
import { LLMConversation } from './types';

type SidebarProps = {
  setShowSettings: (value: boolean) => void;
  toggleChatDrawerVisibility?: () => void;
  conversations: LLMConversation[];
  conversationId: string;
  setConversationId: (value: string) => void;
};

const Sidebar = ({
  toggleChatDrawerVisibility,
  setShowSettings,
  conversations,
  conversationId,
  setConversationId,
}: SidebarProps) => {
  const { t } = useTranslation('common');
  return (
    <div className='scrollbar-trigger flex h-full w-full flex-1 items-start border-white/20 dark:bg-gray-800'>
      <nav className='flex h-full flex-1 flex-col space-y-1 p-2'>
        <div
          className='flex py-3 px-3 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm mb-1 flex-shrink-0 border border-white/20'
          onClick={() => {
            // router.push(`/teams/${router.query.slug}/chat`);
            setConversationId('');
            setShowSettings(false);
            toggleChatDrawerVisibility && toggleChatDrawerVisibility();
          }}>
          <PlusIcon className='h-5 w-5' />
          {t('new-chat')}
        </div>
        <div className='flex-col flex-1 border-b border-white/20 overflow-y-scroll'>
          {!conversationId && (
            <ConversationTile
              key='untitled'
              conversation={{ id: '', title: 'Untitled' }}
              conversationId={conversationId}
              onClick={() => {
                // router.push(`/teams/${router.query.slug}/chat`);
                toggleChatDrawerVisibility && toggleChatDrawerVisibility();
                setShowSettings(false);
              }}
            />
          )}
          {conversations.map((c) => (
            <ConversationTile
              key={c.id}
              conversation={c}
              onClick={() => {
                // router.push(`/teams/${router.query.slug}/chat/${c.id}`);
                toggleChatDrawerVisibility && toggleChatDrawerVisibility();
                setShowSettings(false);
              }}
              conversationId={conversationId}
            />
          ))}
        </div>
        <div
          className='flex py-3 px-3 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm'
          onClick={() => {
            toggleChatDrawerVisibility && toggleChatDrawerVisibility();
          }}>
          <ChatBubbleLeftEllipsisIcon className='h-5 w-5' />
          {t('clear-conversation')}
        </div>
        <div
          className='flex py-3 px-3 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm'
          onClick={() => {
            setShowSettings(true);
            toggleChatDrawerVisibility && toggleChatDrawerVisibility();
          }}>
          <CogIcon className='h-5 w-5' />
          {t('settings')}
        </div>
      </nav>
    </div>
  );
};

function ConversationTile({
  conversation,
  onClick,
  conversationId,
}: {
  conversation: { id: string; title: string };
  onClick?: (id: string) => void;
  conversationId: string;
}) {
  const { title } = conversation;
  return (
    <div
      key={conversation.id}
      className={`flex flex-col gap-2 mb-2 text-gray-100 text-sm rounded-md ${conversation.id === conversationId ? 'bg-gray-500/10' : ''}`}
      onClick={() => {
        onClick && onClick(conversation.id);
      }}>
      <a className='flex py-3 px-3 items-center gap-3 relative rounded-md hover:bg-[#2A2B32] cursor-pointer break-all hover:pr-4 group'>
        <div className='flex-1 text-ellipsis max-h-5 overflow-hidden break-all relative'>{title}</div>
      </a>
    </div>
  );
}

export default Sidebar;
