import { useState } from 'react';
import { useTranslation } from 'next-i18next';

import { useRouter } from '../hooks';
import { configMap } from './lib';
import { ButtonPrimary, Error, LinkBack } from '../shared';

export const SecurityLogsConfigCreate = ({
  urls,
  onSuccess,
}: {
  urls: {
    createConfig: string;
    listConfigs: string;
  };
  onSuccess: (message: string) => void;
}) => {
  const { t } = useTranslation('common');
  const { router } = useRouter();

  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({});
  const [name, setName] = useState('');
  const [type, setType] = useState(t('bui-shared-select-type'));

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);

    const rawResponse = await fetch(urls.createConfig, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, type: configMap[type].type, config }),
    });

    setLoading(false);

    const response = await rawResponse.json();

    if ('error' in response) {
      if (response?.error?.message) {
        return <Error message={response.error.message} />;
      }
    }

    if ('data' in response) {
      onSuccess(t('bui-slc-new-success'));
      router?.replace(urls.listConfigs);
    }
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = event.target as HTMLInputElement;

    setConfig({
      ...config,
      [target.id]: target.value,
    });
  };

  return (
    <>
      <LinkBack href={urls.listConfigs} />
      <h2 className='mb-5 mt-5 font-bold text-gray-700 md:text-xl'>{t('bui-slc-add')}</h2>
      <div className='rounded border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800'>
        <form onSubmit={onSubmit}>
          <div className='flex flex-col space-y-3'>
            <div className='form-control w-full md:w-1/2'>
              <label className='label'>
                <span className='label-text'>{t('bui-shared-type')}</span>
              </label>
              <select
                className='select-bordered select w-full'
                id='type'
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                }}
                required>
                {[t('bui-shared-select-type'), ...Object.keys(configMap)].map((key) => {
                  return (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className='form-control w-full md:w-1/2'>
              <label className='label'>
                <span className='label-text'>{t('bui-shared-name')}</span>
              </label>
              <input
                type='text'
                id='name'
                className='input-bordered input'
                value={name}
                required={false}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('bui-shared-name')}
              />
            </div>
            {type && (
              <>
                {configMap[type] &&
                  configMap[type].fields.map((field) => {
                    return (
                      <div key={field.index} className='form-control w-full md:w-1/2'>
                        <label className='label'>
                          <span className='label-text'>{t(field.label)}</span>
                        </label>
                        <input
                          type={field.type}
                          id={field.name}
                          className='input-bordered input'
                          required
                          onChange={onChange}
                          placeholder={t(field.placeholder)}
                        />
                      </div>
                    );
                  })}
              </>
            )}
            <div>
              <ButtonPrimary loading={loading}>{t('bui-slc-create-config')}</ButtonPrimary>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};
