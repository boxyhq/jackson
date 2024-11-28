import { useTranslation } from 'next-i18next';
import Sidebar from './Sidebar';
import { X } from 'lucide-react';

const MobileSidebar = (props: any) => {
  const { toggleChatDrawerVisibility, setShowSettings, conversations, conversationId, setConversationId } =
    props;
  const { t } = useTranslation('common');

  return (
    <div>
      <button
        type='button'
        aria-hidden='true'
        className='fixed top-[1px] left-[1px] w-[1px] h-0 p-0 m-[-1px] overflow-hidden whitespace-nowrap border-0'></button>
      <div>
        <div className='relative z-40' role='dialog' aria-modal='true'>
          <div className='fixed inset-0 bg-gray-600 bg-opacity-75 opacity-100'></div>
          <div className='fixed inset-0 z-40 flex'>
            <div className='relative flex w-full max-w-xs flex-1 flex-col bg-gray-900 translate-x-0'>
              <div className='absolute top-0 right-0 -mr-12 pt-2 opacity-100'>
                <button
                  type='button'
                  className='ml-1 flex h-10 w-10 items-center justify-center focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white'
                  tabIndex={0}
                  onClick={toggleChatDrawerVisibility}>
                  <span className='sr-only'>{t('bui-chat-close-sidebar')}</span>
                  <X className='h-6 w-6 text-white' />
                </button>
              </div>
              <Sidebar
                setShowSettings={setShowSettings}
                toggleChatDrawerVisibility={toggleChatDrawerVisibility}
                conversations={conversations}
                conversationId={conversationId}
                setConversationId={setConversationId}
              />
            </div>
            <div className='w-14 flex-shrink-0'></div>
          </div>
        </div>
      </div>
      <button
        type='button'
        aria-hidden='true'
        className='fixed top-[1px] left-[1px] w-[1px] h-0 p-0 m-[-1px] overflow-hidden whitespace-nowrap border-0'></button>
    </div>
  );
};

export default MobileSidebar;
