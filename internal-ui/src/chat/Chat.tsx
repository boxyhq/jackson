import { useContext, useEffect, useRef, useState } from 'react';
import { SendHorizontal } from 'lucide-react';
import { useTranslation } from 'next-i18next';
import { useAutoResizeTextArea, useFetch } from '../hooks';
import Message from './Message';
import { LLMChat, LLMModel, LLMProvidersOptionsType } from './types';
import { Loading } from '../shared';
import { ApiSuccess } from '../types';
import { ChatContext } from '../provider';
import { ConversationContext } from './ChatUI';
import { defaultHeaders } from '../utils';

interface ChatProps {
  setShowSettings: (value: boolean) => void;
  conversationId?: string;
  setConversationId: (value: string) => void;
}

const Chat = ({ setShowSettings, conversationId, setConversationId }: ChatProps) => {
  const { t } = useTranslation('common');
  const [errorMessage, setErrorMessage] = useState('');
  const [message, setMessage] = useState('');
  const textAreaRef = useAutoResizeTextArea();
  const bottomOfChatRef = useRef<HTMLDivElement>(null);

  // Get the provider/model plus loading state from the context
  const { provider, model, onError, urls } = useContext(ChatContext);
  const selectedConversation = useContext(ConversationContext)?.selectedConversation;
  let isChatWithPDFProvider = useContext(ConversationContext)?.isChatWithPDFProvider;
  if (selectedConversation) {
    isChatWithPDFProvider = selectedConversation.isChatWithPDFProvider;
  }
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedModel, setSelectedModel] = useState('');

  const [requestInProgress, setRequestInProgress] = useState(false);
  const [isArchived, setIsArchived] = useState(false);

  // Fetch conversation thread
  const {
    data: conversationThreadData,
    isLoading: isLoadingConversationThread,
    error: errorLoadingThread,
    refetch: reloadConversationThread,
  } = useFetch<ApiSuccess<LLMChat[]>>({
    url: conversationId ? `${urls?.conversation}/${conversationId}` : undefined,
  });

  const conversationThread = conversationThreadData?.data;

  useEffect(() => {
    if (!isLoadingConversationThread && errorLoadingThread) {
      onError?.(errorLoadingThread.message);
    }
  }, [isLoadingConversationThread, errorLoadingThread]);

  const {
    data: providersData,
    isLoading: isLoadingProviders,
    error: errorLoadingProviders,
  } = useFetch<ApiSuccess<LLMProvidersOptionsType>>({
    url: urls?.llmProviders,
  });

  const providers = providersData?.data;

  const showCreateLLMConfigMessage =
    !isChatWithPDFProvider && Array.isArray(providers) && providers?.length === 0;
  const showProviderSelection =
    !isChatWithPDFProvider &&
    !showCreateLLMConfigMessage &&
    !provider &&
    Array.isArray(providers) &&
    providers?.length > 0 &&
    (selectedProvider === '' || selectedModel === '');

  const {
    data: modelsData,
    isLoading: isLoadingModels,
    error: errorLoadingModels,
  } = useFetch<ApiSuccess<LLMModel[]>>({
    url: selectedProvider ? `${urls?.llmProviders}/${selectedProvider}/models` : undefined,
  });
  const models = modelsData?.data;

  useEffect(() => {
    if (errorLoadingProviders || errorLoadingModels) {
      onError?.(errorLoadingProviders?.message || errorLoadingModels?.message);
    }
  }, [errorLoadingProviders, errorLoadingModels]);

  useEffect(() => {
    setSelectedProvider(selectedConversation?.provider || '');
    setSelectedModel(selectedConversation?.model || '');
  }, [selectedConversation]);

  useEffect(() => {
    if (selectedConversation && !isChatWithPDFProvider) {
      if (
        providers?.findIndex((p) => p.id === selectedConversation.provider) === -1 ||
        models?.findIndex((m) => m.id === selectedConversation.model) === -1
      ) {
        setIsArchived(true);
      } else {
        setIsArchived(false);
      }
    }
  }, [selectedConversation, providers, models, isChatWithPDFProvider]);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = '24px';
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [message, textAreaRef]);

  function isRefInView(ref) {
    if (!ref.current) return false;

    const rect = ref.current.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  useEffect(() => {
    if (bottomOfChatRef.current) {
      if (isRefInView(bottomOfChatRef)) {
        bottomOfChatRef.current.scrollIntoView({
          behavior: 'auto',
        });
      }
    }
  }, [conversationThread]);

  const [trailingThread, setTrailingThread] = useState<{ content: string | null; role: string }[]>([]);
  const sendMessage = async (e: any) => {
    try {
      setRequestInProgress(true);
      e.preventDefault();
      // const model = getProviderModel();
      const _model = models?.find((m) => m.id === (model || selectedModel));

      if (!isChatWithPDFProvider) {
        if (!provider && !selectedProvider) {
          setErrorMessage('Please select a Provider');
          return;
        }
        if (!_model) {
          setErrorMessage('Please select a Model');
          return;
        }
      }
      // Don't send empty messages
      if (message.length < 1) {
        setErrorMessage('Please enter a message.');
        return;
      } else {
        setErrorMessage('');
      }

      // Add the message to the conversation
      setTrailingThread([
        { content: message, role: 'user' },
        { content: null, role: 'assistant' },
      ]);

      // Clear the message & remove empty chat
      setMessage('');

      if (!urls?.chat) {
        throw new Error('Missing API path for LLM chat');
      }

      const response = await fetch(urls.chat, {
        method: 'POST',
        headers: defaultHeaders,
        body: JSON.stringify({
          messages: [...(conversationThread ?? []), { content: message, role: 'user' }],
          model: _model,
          provider: provider || selectedProvider,
          conversationId,
          isChatWithPDFProvider,
        }),
      });

      if (response.ok) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder('utf-8');
        let receivedData = '';
        if (reader) {
          let done = false;
          let value;
          do {
            const op = await reader.read();
            done = op.done;
            value = op.value;
            if (done) break;
            const dt = decoder.decode(value, { stream: true });
            const jsonData = dt.split('\n').map((d) => {
              if (!d) {
                return {
                  choices: [
                    {
                      delta: {
                        content: '',
                      },
                    },
                  ],
                };
              }
              return JSON.parse(d);
            });
            for (const data of jsonData) {
              if (data.conversationId) {
                // last chunk
                if (conversationId !== data.conversationId) {
                  setConversationId(data.conversationId);
                }
                setTrailingThread([]);
                reloadConversationThread();
              } else if (data.choices) {
                // new chunks get appended
                if (data.choices[0]?.delta?.content) {
                  receivedData += data.choices[0]?.delta?.content || '';
                  setTrailingThread([
                    { content: message, role: 'user' },
                    { content: receivedData, role: 'assistant' },
                  ]);
                }
              } else if (data?.error?.message) {
                setErrorMessage(data?.error?.message);
              }
            }
          } while (!done);
        }
      } else {
        const data = await response.json();
        setErrorMessage(data?.error?.message);
      }
    } catch (error: any) {
      setErrorMessage(error.message);

      // setIsLoading(false);
    } finally {
      setRequestInProgress(false);
    }
  };

  const handleKeypress = (e: any) => {
    // It's triggers by pressing the enter key
    if (e.keyCode == 13 && !e.shiftKey) {
      sendMessage(e);
      e.preventDefault();
    }
  };

  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!urls?.fileUpload) {
      throw new Error('Missing API path for file upload');
    }
    const files = e.target.files;
    if (files && files.length > 0) {
      const formData = new FormData();
      formData.append('file', files[0]);
      setIsUploadingFile(true);
      const response = await fetch(urls.fileUpload, {
        method: 'POST',
        body: formData,
      });
      setIsUploadingFile(false);
      if (!response.ok) {
        const json = await response.json();
        onError?.(json.error.message);
        return;
      }
    }
  };

  const providerName = providers?.find((p) => p.id === (provider || selectedProvider))?.name;
  const modelName = models?.find((m) => m.id === (model || selectedModel))?.name;

  return (
    <div className='relative h-full w-full flex flex-col overflow-hidden items-stretch flex-1'>
      <div className='flex-1 overflow-hidden h-full'>
        <div className='h-full dark:bg-gray-800 flex flex-col'>
          {showProviderSelection && !conversationId && (
            <div className='py-10 relative w-full'>
              <div className='flex items-center justify-center gap-2'>
                <div className='flex flex-col w-full md:w-1/2 lg:w-1/3 xl:w-1/4'>
                  <select
                    className='select-bordered select rounded'
                    name='provider'
                    onChange={(e) => {
                      setSelectedProvider(e.target.value);
                      setSelectedModel('');
                    }}
                    value={selectedProvider}
                    disabled={isLoadingProviders}
                    required>
                    {[
                      {
                        id: '',
                        name: 'Provider',
                      },
                      ...(providers || []),
                    ].map(({ id, name }) => (
                      <option value={id} key={id || name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className='flex flex-col w-full md:w-1/2 lg:w-1/3 xl:w-1/4'>
                  {Array.isArray(models) && models.length > 0 ? (
                    <select
                      className='select-bordered select rounded'
                      name='model'
                      onChange={(e) => {
                        setSelectedModel(e.target.value);
                      }}
                      disabled={isLoadingModels}
                      value={selectedModel}
                      required>
                      {[
                        {
                          id: '',
                          name: 'Model',
                        },
                        ...(models || []),
                      ].map(({ id, name }) => (
                        <option value={id} key={id || name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type='text'
                      name='model'
                      className='input input-bordered rounded'
                      placeholder={t('bui-chat-model')}
                      onChange={(e) => {
                        setSelectedModel(e.target.value);
                      }}
                      value={selectedModel}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
          <div className='h-full flex flex-col items-center text-sm bg-gray-800'>
            {selectedProvider && selectedModel && (
              <div className='flex w-full items-center justify-center gap-1 border-b border-black/10 bg-gray-50 p-3 text-gray-500 dark:border-gray-900/50 dark:bg-gray-700 dark:text-gray-300'>
                {t('bui-chat-provider')}: {providerName} {t('bui-chat-model')}: {modelName || ''}
                {isArchived && <span className='font-bold'>({t('bui-chat-archived')})</span>}
              </div>
            )}
            <div className='w-full overflow-y-scroll flex-1 bg-white'>
              {[...(conversationThread ?? []), ...trailingThread]?.map((message, index) => (
                <Message key={index} message={message} />
              ))}
              <div ref={bottomOfChatRef}></div>
            </div>
          </div>

          {showCreateLLMConfigMessage && (
            <div className='py-10 relative w-full flex flex-col h-full'>
              <div className='flex items-center justify-center gap-2'>
                {t('bui-chat-no-chat-configs-found')}
              </div>
              <div className='flex items-center justify-center gap-2'>
                {t('bui-chat-goto')}{' '}
                <span
                  className='link text-blue-700'
                  onClick={() => {
                    setShowSettings(true);
                  }}>
                  {t('settings')}
                </span>{' '}
                {t('bui-chat-to-create-new-config')}
              </div>
            </div>
          )}
          {/* <div className='flex flex-col items-center text-sm dark:bg-gray-800'></div> */}
        </div>
      </div>
      <div className='mt-auto w-full sm:h-10 md:h-16 flex-shrink-0 bg-gray-800'>
        <div className='w-full border-t md:border-t-0 dark:border-white/20 md:border-transparent md:dark:border-transparent md:bg-vert-light-gradient bg-white dark:bg-gray-800 md:!bg-transparent dark:md:bg-vert-dark-gradient pt-2 h-full'>
          <form className='stretch mx-2 flex flex-row gap-3 last:mb-2 md:mx-4 md:last:mb-2 sm:last:mb-4 lg:mx-auto lg:max-w-2xl xl:max-w-3xl'>
            <div className='relative flex flex-col h-full flex-1 items-stretch md:flex-col'>
              {errorMessage ? (
                <div className='mb-2 md:mb-0'>
                  <div className='h-full flex ml-1 md:w-full md:m-auto md:mb-2 gap-0 md:gap-2 justify-center'>
                    <span className='text-red-500 text-sm'>{errorMessage}</span>
                  </div>
                </div>
              ) : null}
              <div className='flex flex-col w-full  flex-grow py-3 relative border border-black/10 bg-white dark:border-gray-900/50 dark:text-white dark:bg-gray-700 rounded-md shadow-[0_0_10px_rgba(0,0,0,0.10)] dark:shadow-[0_0_15px_rgba(0,0,0,0.10)] focus:border-0 focus-within:bottom-0'>
                {isChatWithPDFProvider && (
                  <>
                    <input
                      type='file'
                      accept='.pdf'
                      className='sr-only'
                      id='pdf-files'
                      onChange={handleFileChange}
                      disabled={isUploadingFile}></input>
                    <label
                      htmlFor='pdf-files'
                      className='absolute left-1 md:left-2 focus:outline-none focus:ring-4 focus:ring-gray-300 top-[50%] translate-y-[-50%] p-2 text-gray-500 rounded cursor-pointer hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600'>
                      {isUploadingFile ? (
                        <Loading spinnerCss='h-6 w-6' />
                      ) : (
                        <svg
                          className='w-4 h-4'
                          aria-hidden='true'
                          xmlns='http://www.w3.org/2000/svg'
                          fill='none'
                          viewBox='0 0 12 20'>
                          <path
                            stroke='currentColor'
                            strokeLinejoin='round'
                            strokeWidth='2'
                            d='M1 6v8a5 5 0 1 0 10 0V4.5a3.5 3.5 0 1 0-7 0V13a2 2 0 0 0 4 0V6'></path>
                        </svg>
                      )}
                      <span className='sr-only'>{t('bui-chat-attach-file')}</span>
                    </label>
                  </>
                )}
                <textarea
                  ref={textAreaRef}
                  value={message}
                  tabIndex={0}
                  data-id='root'
                  // rows={1}
                  placeholder='Send a message...'
                  className='relative left-9 md:left-10 w-[calc(100%-72px)] md:w-[calc(100%-80px)] m-0 h-6 max-h-[200px] resize-none overflow-y-hidden border-0 bg-transparent p-0 outline-none focus:ring-0 focus-visible:ring-0 dark:bg-transparent'
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeypress}></textarea>
                <button
                  disabled={
                    message?.length === 0 ||
                    (!provider && !selectedProvider && !isChatWithPDFProvider) ||
                    (!model && !selectedModel && !isChatWithPDFProvider) ||
                    requestInProgress ||
                    isArchived
                  }
                  onClick={sendMessage}
                  className='absolute p-2 rounded-md bottom-[9px] focus:outline-none focus:ring-4 focus:ring-green-300 bg-transparent enabled:bg-primary disabled:bg-gray-500 right-1 md:right-2 disabled:opacity-40'>
                  <SendHorizontal className='h-4 w-4' />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
