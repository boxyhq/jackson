import { createContext, useContext, useEffect, useState } from 'react';
import Chat from './Chat';
import ChatSettings from './ChatSettings';
import ChatDrawer from './ChatDrawer';
import { useRouter } from 'next/router';
import { Bars4Icon, PlusIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useFetch } from '../hooks';
import { ApiSuccess } from '../types';
import { ChatContext } from '../provider';
import { LLMConversation } from './types';

interface ConversationContextType {
  selectedConversation: LLMConversation;
  isLoadingConversations: boolean;
}

export const ConversationContext = createContext<ConversationContextType | null>(null);

export function ChatUI() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { chatId } = router.query;
  const { urls } = useContext(ChatContext);

  const { data: conversationsData, isLoading: isLoadingConversations } = useFetch<
    ApiSuccess<LLMConversation[]>
  >({ url: urls?.conversation });
  const conversations = conversationsData?.data || [];

  const [isChatDrawerVisible, setIsChatDrawerVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');

  const toggleChatDrawerVisibility = () => {
    setIsChatDrawerVisible(!isChatDrawerVisible);
  };

  useEffect(() => {
    if (chatId && conversationId !== chatId) {
      setConversationId(chatId as string);
    }
  }, [chatId, conversationId]);

  const selectedConversation = conversations?.filter((c) => c.id === conversationId)[0];

  return (
    <ConversationContext.Provider value={{ selectedConversation, isLoadingConversations }}>
      <div className='overflow-hidden w-full h-[90vh] relative flex'>
        <ChatDrawer
          isChatDrawerVisible={isChatDrawerVisible}
          toggleChatDrawerVisibility={toggleChatDrawerVisibility}
          setShowSettings={setShowSettings}
          conversations={conversations}
          conversationId={conversationId}
          setConversationId={setConversationId}
        />
        <div className='flex max-w-full flex-col w-full'>
          <div className='sticky top-0 z-10 flex items-center border-b border-white/20 bg-gray-800 pl-1 pt-1 text-gray-200 sm:pl-3 md:hidden'>
            <button
              type='button'
              className='-ml-0.5 -mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-md hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white dark:hover:text-white'
              onClick={toggleChatDrawerVisibility}>
              <span className='sr-only'>{t('bui-chat-open-sidebar')}</span>
              <Bars4Icon className='h-6 w-6 text-white' />
            </button>
            <h1 className='flex-1 text-center text-base font-normal'>
              {showSettings ? t('settings') : selectedConversation?.title || t('new-chat')}
            </h1>
            <button
              type='button'
              className='px-3'
              onClick={() => {
                // router.push(`/teams/${teamSlug}/chat`);
                setConversationId('');
                setShowSettings(false);
              }}>
              <PlusIcon className='h-6 w-6' />
            </button>
          </div>
          {showSettings ? (
            <ChatSettings />
          ) : (
            <Chat
              setShowSettings={setShowSettings}
              conversationId={conversationId}
              setConversationId={setConversationId}
            />
          )}
        </div>
      </div>
    </ConversationContext.Provider>
  );
}
