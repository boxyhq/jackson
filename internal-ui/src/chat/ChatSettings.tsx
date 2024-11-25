import { useTranslation } from 'next-i18next';
import { useContext, useEffect, useState } from 'react';
import { Button, Input } from 'react-daisyui';
import { Table, Card, Badge, ConfirmationModal, InputWithLabel, Loading } from '../shared';
import { LLMConfig, LLMModel, LLMProvidersOptionsType } from './types';
import { ChatContext } from '../provider';
import { useFetch } from '../hooks';
import { ApiSuccess } from '../types';
import { defaultHeaders } from '../utils';

export default function ChatSettings() {
  const { t } = useTranslation('common');
  const [selectedProvider, setSelectedProvider] = useState<LLMProvidersOptionsType[number]['id'] | ''>(
    'openai'
  );
  const [selectedModel, setSelectedModel] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState('');
  const [baseURL, setBaseURL] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationDialogVisible, setConfirmationDialogVisible] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<any>(null);
  const [isChatWithPDFProvider, setIsChatWithPDFProvider] = useState(false);

  const [view, switchView] = useState<'list' | 'create' | 'edit'>('list');

  const { urls, onError, onSuccess } = useContext(ChatContext);

  const {
    data: llmConfigsData,
    isLoading: isLoadingConfigs,
    refetch: reloadConfigs,
    error: errorLoadingConfigs,
  } = useFetch<ApiSuccess<LLMConfig[]>>({
    url: urls?.llmConfig,
  });
  const llmConfigs = llmConfigsData?.data || [];

  const {
    data: providersData,
    isLoading: isLoadingProviders,
    error: errorLoadingProviders,
  } = useFetch<ApiSuccess<LLMProvidersOptionsType>>({
    url: `${urls?.llmProviders}?filterByTenant=false`,
  });

  const providers = providersData?.data || [];

  const {
    data: modelsData,
    isLoading: isLoadingModels,
    error: errorLoadingModels,
  } = useFetch<ApiSuccess<LLMModel[]>>({
    url: selectedProvider
      ? `${urls?.llmProviders}/${selectedProvider}/models?filterByTenant=false`
      : undefined,
  });
  const models = modelsData?.data || [];

  useEffect(() => {
    if (errorLoadingConfigs || errorLoadingProviders || errorLoadingModels) {
      onError?.(
        errorLoadingConfigs?.message || errorLoadingProviders?.message || errorLoadingModels?.message
      );
    }
  }, [errorLoadingConfigs, errorLoadingProviders, errorLoadingModels]);

  const createLLMConfig = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);

    const response = await fetch(`${urls?.llmConfig}`, {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify({
        provider: isChatWithPDFProvider ? 'openai' : selectedProvider,
        models: isChatWithPDFProvider ? [] : selectedModel,
        apiKey: apiKey ?? undefined,
        baseURL,
        isChatWithPDFProvider,
      }),
    });
    setLoading(false);

    const result = await response.json();

    if (!response.ok) {
      onError?.(result.error.message);
      return;
    }

    onSuccess?.(t('bui-chat-config-created'));
    reloadConfigs();
    resetForm();
  };

  const deleteConfig = async (config: any) => {
    if (!config) {
      return;
    }

    const response = await fetch(`${urls?.llmConfig}/${config.id}`, {
      method: 'DELETE',
      headers: defaultHeaders,
    });

    if (!response.ok) {
      const json = await response.json();
      setConfirmationDialogVisible(false);
      onError?.(json.error.message);
      return;
    }

    setSelectedConfig(null);
    reloadConfigs();
    setConfirmationDialogVisible(false);
    onSuccess?.(t('bui-chat-config-deleted'));
  };

  const updateLLMConfig = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);

    const response = await fetch(`${urls?.llmConfig}/${selectedConfig?.id}`, {
      method: 'PUT',
      headers: defaultHeaders,
      body: JSON.stringify({
        provider: selectedProvider,
        models: selectedModel,
        apiKey: apiKey ?? undefined,
        isChatWithPdfProvider: selectedConfig.isChatWithPdfProvider,
        baseURL,
      }),
    });

    setLoading(false);
    if (!response.ok) {
      const json = await response.json();
      onError?.(json.error.message);
      return;
    }

    onSuccess?.(t('bui-chat-config-updated'));
    reloadConfigs();
    resetForm();
  };

  const resetForm = () => {
    setSelectedProvider('');
    setSelectedModel([]);
    setApiKey('');
    setBaseURL('');
    switchView('list');
  };

  return (
    <>
      <Card className='h-full'>
        <Card.Body>
          <Card.Header>
            <Card.Title>
              <span className='text-2xl font-normal'>{t('settings')}</span>
            </Card.Title>
          </Card.Header>

          <h4 className='text-base'>{t('bui-chat-llm-providers')}</h4>
          {view === 'list' && (
            <Button
              type='button'
              className='self-start'
              color='primary'
              size='md'
              onClick={() => {
                switchView('create');
                setSelectedProvider('openai');
              }}>
              {t('bui-chat-add')}
            </Button>
          )}
          {isLoadingConfigs && <Loading />}
          {view === 'list' && llmConfigs.length > 0 && (
            <Table
              cols={['Provider', 'Models', 'Created', 'Actions']}
              body={llmConfigs.map((config) => {
                const providerName = providers.find((p) => p.id === config.provider)?.name;
                return {
                  id: config.id,
                  cells: [
                    {
                      element: config.isChatWithPDFProvider ? (
                        <Badge color='primary'>{t('bui-chat-with-pdf-provider')}</Badge>
                      ) : (
                        <span>{providerName}</span>
                      ),
                    },
                    {
                      wrap: true,
                      text:
                        config.models
                          // .map((a: string) => {
                          //   // const modelName = models.find((m) => m.id === a)?.name;
                          //   // return modelName;
                          //   // ollama is a special case where the model is open ended
                          //   // config.models
                          // })
                          .join(', ') || '*',
                    },
                    {
                      wrap: true,
                      text: new Date(config.createdAt).toDateString(),
                      minWidth: 160,
                    },
                    {
                      buttons: [
                        {
                          text: t('bui-shared-edit'),
                          onClick: () => {
                            setSelectedConfig(config);
                            // setIsEdit(true);
                            switchView('edit');
                            setSelectedProvider(config.provider);
                            setSelectedModel(config.models);
                            // setApiKey(config.apiKey || '');
                            setBaseURL(config.baseURL || '');
                          },
                        },
                        {
                          color: 'error',
                          text: t('bui-chat-remove'),
                          onClick: () => {
                            setSelectedConfig(config);
                            setConfirmationDialogVisible(true);
                          },
                        },
                      ],
                    },
                  ],
                };
              })}></Table>
          )}
          {(view === 'edit' || view === 'create') && (
            <form className='w-full' onSubmit={view === 'edit' ? updateLLMConfig : createLLMConfig}>
              <div className='flex flex-col gap-2'>
                {view === 'create' && (
                  <div className='flex items-center'>
                    <input
                      checked={isChatWithPDFProvider}
                      id='chat-with-pdf-provider'
                      type='checkbox'
                      className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600'
                      onChange={(e) => setIsChatWithPDFProvider(e.target.checked)}
                    />
                    <label
                      htmlFor='chat-with-pdf-provider'
                      className='ms-2 text-sm font-medium text-gray-900 dark:text-gray-300 cursor-pointer'>
                      {t('bui-chat-with-pdf-provider')}
                    </label>
                  </div>
                )}
                {((view === 'create' && !isChatWithPDFProvider) ||
                  (view === 'edit' && !selectedConfig.isChatWithPDFProvider)) && (
                  <>
                    <div>
                      <div className='label'>
                        <span className='label-text '>{t('bui-chat-provider')}</span>
                      </div>
                      <label className='form-control'>
                        {!isLoadingProviders ? (
                          <select
                            className='select-bordered select rounded'
                            name='role'
                            onChange={(e) => {
                              setSelectedProvider(e.target.value as LLMProvidersOptionsType[number]['id']);
                              setSelectedModel([]);
                            }}
                            value={selectedProvider}
                            required>
                            {[
                              {
                                id: '',
                                name: 'Provider',
                              },
                              ...providers,
                            ].map((role) => (
                              <option value={role.id} key={role.id}>
                                {role.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Loading />
                        )}
                      </label>
                    </div>
                    <div>
                      <div className='label'>
                        <span className='label-text '>{t('bui-chat-model')}</span>
                      </div>
                      <label className='form-control'>
                        {selectedProvider !== '' && models.length > 0 && !isLoadingModels ? (
                          <select
                            className='select-bordered select rounded'
                            name='role'
                            onChange={(e) => {
                              const selectedOptions = Array.from(e.target.selectedOptions).map(
                                (option) => option.value
                              );
                              setSelectedModel(selectedOptions);
                            }}
                            value={selectedModel}
                            multiple>
                            {[
                              {
                                id: '',
                                name: 'Model',
                              },
                              ...models,
                            ].map((role) => (
                              <option value={role.id} key={role.id}>
                                {role.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Input
                            name='model'
                            onChange={(e) => {
                              setSelectedModel([e.target.value]);
                            }}
                            value={selectedModel}
                            placeholder={t('bui-chat-model')}
                          />
                        )}
                      </label>
                    </div>
                  </>
                )}
                <div>
                  <InputWithLabel
                    label={t('bui-chat-api-key')}
                    name='apiKey'
                    placeholder={t('bui-chat-api-key')}
                    type='password'
                    value={apiKey}
                    // onFocus={() => setApiKey('')}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>
                <div>
                  <InputWithLabel
                    label={t('bui-chat-base-url')}
                    name='baseURL'
                    placeholder={t('bui-chat-base-url')}
                    type='text'
                    value={baseURL}
                    onChange={(e) => setBaseURL(e.target.value)}
                  />
                </div>
                {(view === 'edit' || view === 'create') && (
                  <div className='self-end'>
                    <Button
                      type='reset'
                      className='mr-2'
                      color='secondary'
                      size='md'
                      onClick={() => resetForm()}>
                      {t('cancel')}
                    </Button>
                    <Button type='submit' color='primary' size='md' disabled={loading}>
                      {t('bui-shared-save-changes')}
                    </Button>
                  </div>
                )}
              </div>
            </form>
          )}
        </Card.Body>
        {/* <Card.Footer> */}
        <div className='flex justify-end gap-2'></div>
        {/* </Card.Footer> */}
      </Card>
      <ConfirmationModal
        visible={confirmationDialogVisible}
        onCancel={() => setConfirmationDialogVisible(false)}
        onConfirm={() => deleteConfig(selectedConfig)}
        title={t('bui-chat-config-deletion-title')}
        description={t('bui-chat-config-deletion-description')}></ConfirmationModal>
    </>
  );
}
