import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useTranslation } from 'next-i18next';
import type { SecurityLogsConfig } from '@boxyhq/saml-jackson';

import { fetcher } from '../utils';
import { ButtonPrimary, LinkBack, Loading } from '../shared';
import { SinkConfigMapField, getFieldsFromSinkType } from './lib';
import { Error } from '../shared';
import { ApiError, ApiResponse, ApiSuccess } from '../types';
import { useRouter } from '../hooks';
import { SecurityLogsConfigDelete } from './SecurityLogsConfigDelete';

export const SecurityLogsConfigEdit = ({
  id,
  urls,
  onError,
  onSuccess,
}: {
  id: string;
  urls: {
    getById: (id: string) => string;
    updateById: (id: string) => string;
    deleteById: (id: string) => string;
    listConfigs: string;
  };
  onError: (error: string) => void;
  onSuccess: (message: string) => void;
}) => {
  const { t } = useTranslation('common');
  const { router } = useRouter();

  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<any>({});
  const [fields, setFields] = useState<SinkConfigMapField[]>([]);

  const { data, error, isLoading } = useSWR<ApiSuccess<SecurityLogsConfig>, ApiError>(
    urls.getById(id),
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  useEffect(() => {
    if (data) {
      setConfig(data.data?.config);
      setFields(getFieldsFromSinkType(data.data?.type) || []);
    }
  }, [data]);

  if (error) {
    <Error message={error.message} />;
    return null;
  }

  if (isLoading) {
    return <Loading />;
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);

    const rawResponse = await fetch(urls.updateById(id), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        config,
        type: data?.data?.type,
      }),
    });

    setLoading(false);

    const response: ApiResponse<SecurityLogsConfig> = await rawResponse.json();

    if ('error' in response) {
      if (response?.error?.message) {
        onError(response.error.message);
        return;
      }
    }

    if ('data' in response) {
      onSuccess(t('bui-slc-update-success'));
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
      <div className='mb-5 flex items-center justify-between'>
        <h2 className='mt-5 font-bold text-gray-700 md:text-xl'>{t('bui-slc-update')}</h2>
      </div>
      <div className='rounded border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800'>
        <form onSubmit={onSubmit}>
          <div className='space-y-3'>
            {fields.map((field) => {
              return (
                <div className='form-control w-full md:w-1/2' key={field.index}>
                  <label className='label'>
                    <span className='label-text'>{t(field.label)}</span>
                  </label>
                  <input
                    type={field.type}
                    className='input-bordered input'
                    id={field.name}
                    placeholder={t(field.placeholder)}
                    value={config[field.name]}
                    onChange={onChange}
                  />
                </div>
              );
            })}
            <div>
              <ButtonPrimary type='submit' loading={loading}>
                {t('bui-shared-save-changes')}
              </ButtonPrimary>
            </div>
          </div>
        </form>
      </div>
      <SecurityLogsConfigDelete id={id} urls={urls} onSuccess={onSuccess} onError={onError} />
    </>
  );
};
