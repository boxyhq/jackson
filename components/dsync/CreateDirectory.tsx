import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { ApiResponse } from 'types';
import { errorToast, successToast } from '@components/Toaster';
import type { Directory } from '@boxyhq/saml-jackson';
import { LinkBack } from '@components/LinkBack';
import { ButtonPrimary } from '@components/ButtonPrimary';
import useDirectoryProviders from '@lib/ui/hooks/useDirectoryProviders';

interface CreateDirectoryProps {
  setupLinkToken?: string;
  defaultWebhookEndpoint: string | undefined;
}

type UnSavedDirectory = Omit<Directory, 'id' | 'log_webhook_events' | 'scim' | 'deactivated' | 'webhook'> & {
  webhook_url: string;
  webhook_secret: string;
};

const defaultDirectory: UnSavedDirectory = {
  name: '',
  tenant: '',
  product: '',
  webhook_url: '',
  webhook_secret: '',
  type: 'azure-scim-v2',
  google_domain: '',
};

const CreateDirectory = ({ setupLinkToken, defaultWebhookEndpoint }: CreateDirectoryProps) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { providers } = useDirectoryProviders(setupLinkToken);
  const [loading, setLoading] = useState(false);
  const [showDomain, setShowDomain] = useState(false);
  const [directory, setDirectory] = useState<UnSavedDirectory>({
    ...defaultDirectory,
    webhook_url: defaultWebhookEndpoint || '',
  });

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);

    const rawResponse = await fetch(
      setupLinkToken ? `/api/setup/${setupLinkToken}/directory-sync` : '/api/admin/directory-sync',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(directory),
      }
    );

    setLoading(false);

    const response: ApiResponse<Directory> = await rawResponse.json();

    if ('error' in response) {
      errorToast(response.error.message);
      return;
    }

    if (rawResponse.ok) {
      router.replace(
        setupLinkToken
          ? `/setup/${setupLinkToken}/directory-sync/${response.data.id}`
          : `/admin/directory-sync/${response.data.id}`
      );
      successToast(t('directory_created_successfully'));
      return;
    }
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = event.target as HTMLInputElement;

    setDirectory({
      ...directory,
      [target.id]: target.value,
    });

    // Ask for domain if google is selected
    if (target.id === 'type') {
      target.value === 'google' ? setShowDomain(true) : setShowDomain(false);
    }
  };

  const backUrl = setupLinkToken ? `/setup/${setupLinkToken}/directory-sync` : '/admin/directory-sync';

  return (
    <div>
      <LinkBack href={backUrl} />
      <h2 className='mb-5 mt-5 font-bold text-gray-700 md:text-xl'>{t('new_directory')}</h2>
      <div className='min-w-[28rem] rounded border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800'>
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
              />
            </div>
            <div className='form-control w-full'>
              <label className='label'>
                <span className='label-text'>{t('directory_provider')}</span>
              </label>
              <select className='select-bordered select w-full' id='type' onChange={onChange} required>
                {providers &&
                  Object.keys(providers).map((key) => {
                    return (
                      <option key={key} value={key}>
                        {providers[key]}
                      </option>
                    );
                  })}
              </select>
            </div>
            {showDomain && (
              <div className='form-control w-full'>
                <label className='label'>
                  <span className='label-text'>{t('directory_domain')}</span>
                </label>
                <input
                  type='text'
                  id='google_domain'
                  className='input-bordered input w-full'
                  onChange={onChange}
                  value={directory.google_domain}
                  pattern='^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$'
                  title='Please enter a valid domain (e.g: boxyhq.com)'
                />
              </div>
            )}
            {!setupLinkToken && (
              <>
                <div className='form-control w-full'>
                  <label className='label'>
                    <span className='label-text'>{t('tenant')}</span>
                  </label>
                  <input
                    type='text'
                    id='tenant'
                    className='input-bordered input w-full'
                    required
                    onChange={onChange}
                  />
                </div>
                <div className='form-control w-full'>
                  <label className='label'>
                    <span className='label-text'>{t('product')}</span>
                  </label>
                  <input
                    type='text'
                    id='product'
                    className='input-bordered input w-full'
                    required
                    onChange={onChange}
                  />
                </div>
              </>
            )}
            <div className='form-control w-full'>
              <label className='label'>
                <span className='label-text'>{t('webhook_url')}</span>
              </label>
              <input
                type='text'
                id='webhook_url'
                className='input-bordered input w-full'
                onChange={onChange}
                value={directory.webhook_url}
              />
            </div>
            <div className='form-control w-full'>
              <label className='label'>
                <span className='label-text'>{t('webhook_secret')}</span>
              </label>
              <input
                type='text'
                id='webhook_secret'
                className='input-bordered input w-full'
                onChange={onChange}
              />
            </div>
            <div>
              <ButtonPrimary loading={loading}>{t('create_directory')}</ButtonPrimary>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDirectory;
