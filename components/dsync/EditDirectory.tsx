import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import type { Directory } from '@boxyhq/saml-jackson';
import type { ApiResponse } from 'types';
import { errorToast, successToast } from '@components/Toaster';
import { LinkBack } from '@components/LinkBack';
import { ButtonPrimary } from '@components/ButtonPrimary';
import Loading from '@components/Loading';
import useDirectory from '@lib/ui/hooks/useDirectory';
import { ToggleConnectionStatus } from './ToggleConnectionStatus';

type FormState = Pick<Directory, 'name' | 'log_webhook_events' | 'webhook'>;

const defaultFormState: FormState = {
  name: '',
  log_webhook_events: false,
  webhook: {
    endpoint: '',
    secret: '',
  },
};

const EditDirectory = ({ directoryId, setupLinkToken }: { directoryId: string; setupLinkToken?: string }) => {
  const router = useRouter();
  const { t } = useTranslation('common');

  const [loading, setLoading] = useState(false);
  const [directoryUpdated, setDirectoryUpdated] = useState<FormState>(defaultFormState);
  const { directory, isLoading, error } = useDirectory(directoryId, setupLinkToken);

  useEffect(() => {
    if (directory) {
      setDirectoryUpdated({
        name: directory.name,
        log_webhook_events: directory.log_webhook_events,
        webhook: {
          endpoint: directory.webhook?.endpoint,
          secret: directory.webhook?.secret,
        },
      });
    }
  }, [directory]);

  if (isLoading || !directory) {
    return <Loading />;
  }

  if (error) {
    errorToast(error.message);
    return null;
  }

  const backUrl = setupLinkToken ? `/setup/${setupLinkToken}/directory-sync` : '/admin/directory-sync';
  const putUrl = setupLinkToken
    ? `/api/setup/${setupLinkToken}/directory-sync/${directoryId}`
    : `/api/admin/directory-sync/${directoryId}`;
  const redirectUrl = setupLinkToken ? `/setup/${setupLinkToken}/directory-sync` : '/admin/directory-sync';

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);

    const rawResponse = await fetch(putUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(directoryUpdated),
    });

    setLoading(false);

    const response: ApiResponse<Directory> = await rawResponse.json();

    if ('error' in response) {
      errorToast(response.error.message);
      return null;
    }

    if (rawResponse.ok) {
      successToast(t('directory_updated_successfully'));
      router.replace(redirectUrl);
    }
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const target = event.target as HTMLInputElement;
    const value = target.type === 'checkbox' ? target.checked : target.value;

    if (target.id === 'webhook.endpoint' || target.id === 'webhook.secret') {
      setDirectoryUpdated({
        ...directoryUpdated,
        webhook: {
          ...directoryUpdated.webhook,
          [target.id.split('.')[1]]: value,
        },
      });

      return;
    }

    setDirectoryUpdated({
      ...directoryUpdated,
      [target.id]: value,
    });
  };

  return (
    <div>
      <LinkBack href={backUrl} />
      <div className='flex items-center justify-between'>
        <h2 className='mb-5 mt-5 font-bold text-gray-700 md:text-xl'>{t('update_directory')}</h2>
        <ToggleConnectionStatus connection={directory} setupLinkToken={setupLinkToken} />
      </div>
      <div className='rounded border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800'>
        <form onSubmit={onSubmit}>
          <div className='flex flex-col space-y-3'>
            <div className='form-control w-full'>
              <label className='label'>
                <span className='label-text'>{t('directory_name')}</span>
              </label>
              <input
                type='text'
                id='name'
                className='input-bordered input w-full'
                required
                onChange={onChange}
                value={directoryUpdated.name}
              />
            </div>
            <div className='form-control w-full'>
              <label className='label'>
                <span className='label-text'>{t('webhook_url')}</span>
              </label>
              <input
                type='text'
                id='webhook.endpoint'
                className='input-bordered input w-full'
                onChange={onChange}
                value={directoryUpdated.webhook.endpoint}
              />
            </div>
            <div className='form-control w-full'>
              <label className='label'>
                <span className='label-text'>{t('webhook_secret')}</span>
              </label>
              <input
                type='text'
                id='webhook.secret'
                className='input-bordered input w-full'
                onChange={onChange}
                value={directoryUpdated.webhook.secret}
              />
            </div>
            <div className='form-control w-full py-2'>
              <div className='flex items-center'>
                <input
                  id='log_webhook_events'
                  type='checkbox'
                  checked={directoryUpdated.log_webhook_events}
                  onChange={onChange}
                  className='h-4 w-4 rounded border-gray-300 bg-gray-100 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600'
                />
                <label className='ml-2 text-sm font-medium text-gray-900 dark:text-gray-300'>
                  {t('enable_webhook_events_logging')}
                </label>
              </div>
            </div>
            <div>
              <ButtonPrimary type='submit' loading={loading}>
                {t('save_changes')}
              </ButtonPrimary>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDirectory;
