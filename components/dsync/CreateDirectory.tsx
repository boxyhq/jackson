import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import React from 'react';
import classNames from 'classnames';
import { ApiResponse } from 'types';
import { errorToast, successToast } from '@components/Toast';
import type { Directory } from '@boxyhq/saml-jackson';
import { LinkOutline } from '@components/LinkOutline';

type CreateDirectoryProps = {
  providers: any;
  token?: string;
};

const CreateDirectory = ({ providers, token }: CreateDirectoryProps) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [directory, setDirectory] = React.useState({
    name: '',
    tenant: '',
    product: '',
    webhook_url: '',
    webhook_secret: '',
    type: providers ? (Object.keys(providers).length > 0 ? Object.keys(providers)[0] : '') : '',
  });

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);

    const rawResponse = await fetch(
      token ? `/api/setup/${token}/directory-sync` : '/api/admin/directory-sync',
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
        token
          ? `/setup/${token}/directory-sync/${response.data.id}`
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
  };

  return (
    <div>
      <LinkOutline href='/admin/directory-sync' Icon={ArrowLeftIcon}>
        {t('back')}
      </LinkOutline>
      <h2 className='mb-5 mt-5 font-bold text-gray-700 md:text-xl'>{t('new_directory')}</h2>
      <div className='min-w-[28rem] rounded border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800 md:w-3/4 md:max-w-lg'>
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
                {Object.keys(providers).map((key) => {
                  return (
                    <option key={key} value={key}>
                      {providers[key]}
                    </option>
                  );
                })}
              </select>
            </div>
            {!token && (
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
              <button className={classNames('btn-primary btn', loading ? 'loading' : '')}>
                {t('create_directory')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDirectory;
