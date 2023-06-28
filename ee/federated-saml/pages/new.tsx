import type { NextPage } from 'next';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import type { SAMLFederationApp } from '@boxyhq/saml-jackson';

import type { ApiResponse } from 'types';
import LicenseRequired from '@components/LicenseRequired';
import { LinkBack } from '@components/LinkBack';
import { ButtonPrimary } from '@components/ButtonPrimary';
import { errorToast, successToast } from '@components/Toaster';

const NewApp: NextPage = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [newApp, setApp] = useState({
    name: '',
    tenant: '',
    product: '',
    acsUrl: '',
    entityId: '',
  });

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);

    const rawResponse = await fetch('/api/admin/federated-saml', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newApp),
    });

    setLoading(false);

    const response: ApiResponse<SAMLFederationApp> = await rawResponse.json();

    if ('error' in response) {
      errorToast(response.error.message);
      return;
    }

    if ('data' in response) {
      successToast(t('saml_federation_new_success'));
      router.replace(`/admin/federated-saml/${response.data.id}/edit`);
    }
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = event.target as HTMLInputElement;

    setApp({
      ...newApp,
      [target.id]: target.value,
    });
  };

  return (
    <LicenseRequired>
      <LinkBack href='/admin/federated-saml' />
      <h2 className='mb-5 mt-5 font-bold text-gray-700 md:text-xl'>{t('saml_federation_add_new_app')}</h2>
      <div className='rounded border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800'>
        <form onSubmit={onSubmit}>
          <div className='flex flex-col space-y-3'>
            <p className='text-sm leading-6 text-gray-800'>{t('saml_federation_add_new_app_description')}</p>
            <div className='form-control w-full md:w-1/2'>
              <label className='label'>
                <span className='label-text'>{t('name')}</span>
              </label>
              <input
                type='text'
                id='name'
                className='input-bordered input'
                required
                onChange={onChange}
                placeholder='Your app'
              />
            </div>
            <div className='form-control w-full md:w-1/2'>
              <label className='label'>
                <span className='label-text'>{t('tenant')}</span>
              </label>
              <input
                type='text'
                id='tenant'
                className='input-bordered input'
                required
                onChange={onChange}
                placeholder='boxyhq'
              />
            </div>
            <div className='form-control w-full md:w-1/2'>
              <label className='label'>
                <span className='label-text'>{t('product')}</span>
              </label>
              <input
                type='text'
                id='product'
                className='input-bordered input'
                required
                onChange={onChange}
                placeholder='saml-jackson'
              />
            </div>
            <div className='form-control w-full md:w-1/2'>
              <label className='label'>
                <span className='label-text'>{t('acs_url')}</span>
              </label>
              <input
                type='url'
                id='acsUrl'
                className='input-bordered input'
                required
                onChange={onChange}
                placeholder='https://your-idp.com/saml/acs'
              />
            </div>
            <div className='form-control w-full md:w-1/2'>
              <label className='label'>
                <span className='label-text'>{t('entity_id')}</span>
              </label>
              <input
                type='url'
                id='entityId'
                className='input-bordered input'
                required
                onChange={onChange}
                placeholder='https://your-idp.com/saml/entityId'
              />
            </div>
            <div>
              <ButtonPrimary loading={loading}>{t('create_app')}</ButtonPrimary>
            </div>
          </div>
        </form>
      </div>
    </LicenseRequired>
  );
};

export default NewApp;
