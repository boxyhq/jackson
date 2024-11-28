import { useTranslation } from 'next-i18next';
import { Plus, MessageCircle, Settings, Search } from 'lucide-react';
import { LLMConversation } from './types';
import { ConversationContext } from './ChatUI';
import { useContext } from 'react';
import { Badge } from '../shared';

type SidebarProps = {
  setShowSettings: (value: boolean) => void;
  toggleChatDrawerVisibility?: () => void;
  conversations?: LLMConversation[];
  conversationId?: string;
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
  const setIsChatWithPDFProvider = useContext(ConversationContext)?.setIsChatWithPDFProvider;
  return (
    <div className='scrollbar-trigger flex h-full w-full flex-1 items-start border-white/20 dark:bg-gray-800'>
      <nav className='flex h-full flex-1 flex-col space-y-1 p-2'>
        <div
          className='flex py-3 px-3 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm mb-1 flex-shrink-0 border border-white/20'
          onClick={() => {
            setConversationId('');
            setIsChatWithPDFProvider?.(false);
            setShowSettings(false);
            if (typeof toggleChatDrawerVisibility === 'function') {
              toggleChatDrawerVisibility();
            }
          }}>
          <Plus className='h-5 w-5' />
          {t('bui-chat-new-chat')}
        </div>
        <div className='flex-col flex-1 border-b border-white/20 overflow-y-scroll'>
          {!conversationId && (
            <ConversationTile
              key='untitled'
              conversation={{ id: '', title: 'Untitled' }}
              conversationId={conversationId}
              onClick={() => {
                if (typeof toggleChatDrawerVisibility === 'function') {
                  toggleChatDrawerVisibility();
                }
                setIsChatWithPDFProvider?.(false);
                setShowSettings(false);
              }}
            />
          )}
          {conversations?.map((c) => (
            <ConversationTile
              key={c.id}
              conversation={c}
              onClick={() => {
                setConversationId(c.id);
                if (typeof toggleChatDrawerVisibility === 'function') {
                  toggleChatDrawerVisibility();
                }
                setShowSettings(false);
                setIsChatWithPDFProvider?.(false);
              }}
              conversationId={conversationId}
            />
          ))}
        </div>
        <div
          className='flex py-3 px-3 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm'
          onClick={() => {
            if (typeof toggleChatDrawerVisibility === 'function') {
              toggleChatDrawerVisibility();
            }
          }}>
          <MessageCircle className='h-5 w-5' />
          {t('bui-chat-clear-conversation')}
        </div>
        <button
          className='flex py-3 px-3 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm'
          onClick={() => {
            setShowSettings(false);
            setIsChatWithPDFProvider?.(true);
            setConversationId('');
            if (typeof toggleChatDrawerVisibility === 'function') {
              toggleChatDrawerVisibility();
            }
          }}>
          <Search className='h-5 w-5' />
          {t('bui-chat-with-pdf')}
        </button>
        <div
          className='flex py-3 px-3 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm'
          onClick={() => {
            setShowSettings(true);
            setConversationId('');
            if (typeof toggleChatDrawerVisibility === 'function') {
              toggleChatDrawerVisibility();
            }
          }}>
          <Settings className='h-5 w-5' />
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
  conversation: Partial<LLMConversation>;
  onClick?: (id: string) => void;
  conversationId?: string;
}) {
  const { title, isChatWithPDFProvider, id } = conversation;
  return (
    <div
      key={conversation.id}
      className={`flex flex-col gap-2 mb-2 text-gray-100 text-sm rounded-md ${conversation.id === conversationId ? 'bg-gray-500/10' : ''}`}
      onClick={() => {
        if (typeof onClick === 'function') {
          onClick(id!);
        }
      }}>
      <a className='flex py-3 px-3 items-center gap-3 relative rounded-md hover:bg-[#2A2B32] cursor-pointer break-all hover:pr-4 group'>
        <div className='flex-1 text-ellipsis max-h-5 overflow-hidden break-all relative'>{title}</div>
        {isChatWithPDFProvider && <Badge className='bg-blue-500'>PDF</Badge>}
      </a>
    </div>
  );
}

export default Sidebar;
