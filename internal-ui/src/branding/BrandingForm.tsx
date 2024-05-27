import { useState } from 'react';
import type { Branding, IdentityFederationApp } from '../types';
import { useTranslation } from 'next-i18next';
import { ButtonPrimary } from '../shared';

export const BrandingForm = ({
  urls,
  onUpdate,
  onError,
}: {
  urls: { getBranding: string; updateBranding: string };
  onUpdate?: (data: IdentityFederationApp | Branding) => void;
  onError?: (error: Error) => void;
}) => {
  const { t } = useTranslation('common');

  const [loading, setLoading] = useState(false);
  const [branding, setBranding] = useState<Branding>({
    logoUrl: '',
    faviconUrl: '',
    companyName: '',
    primaryColor: '',
  });

  const onChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = event.target as HTMLInputElement;

    setBranding({
      ...branding,
      [target.id]: target.value,
    });
  };

  // Update Branding
  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);

    const rawResponse = await fetch(urls.updateBranding, {
      method: 'POST',
      body: JSON.stringify(branding),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    setLoading(false);

    const response = await rawResponse.json();

    if (rawResponse.ok) {
      onUpdate?.(response.data);
    } else {
      onError?.(response.error);
    }
  };
  return (
    <>
      <h2 className='mt-5 font-bold text-gray-700 md:text-xl'>{t('settings_branding_title')}</h2>
      <p className='py-3 text-base leading-6 text-gray-800'>{t('settings_branding_description')}</p>
      <div className='rounded border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800'>
        <form onSubmit={onSubmit}>
          <div className='flex flex-col space-y-2'>
            <div className='form-control w-full md:w-1/2'>
              <label className='label'>
                <span className='label-text'>{t('bui-shared-logo-url')}</span>
              </label>
              <input
                type='url'
                id='logoUrl'
                className='input-bordered input'
                onChange={onChange}
                value={branding.logoUrl || ''}
                placeholder='https://company.com/logo.png'
              />
              <label className='label'>
                <span className='label-text-alt'>{t('bui-shared-logo-url-desc')}</span>
              </label>
            </div>
            <div className='form-control w-full md:w-1/2'>
              <label className='label'>
                <span className='label-text'>{t('bui-shared-favicon-url')}</span>
              </label>
              <input
                type='url'
                id='faviconUrl'
                className='input-bordered input'
                onChange={onChange}
                value={branding.faviconUrl || ''}
                placeholder='https://company.com/favicon.ico'
              />
              <label className='label'>
                <span className='label-text-alt'>{t('bui-shared-favicon-url-desc')}</span>
              </label>
            </div>
            <div className='form-control w-full md:w-1/2'>
              <label className='label'>
                <span className='label-text'>{t('branding_company_name_label')}</span>
              </label>
              <input
                type='text'
                id='companyName'
                className='input-bordered input'
                onChange={onChange}
                value={branding.companyName || ''}
                placeholder={t('branding_company_name_label')}
              />
              <label className='label'>
                <span className='label-text-alt'>{t('branding_company_name_alt')}</span>
              </label>
            </div>
            <div className='form-control'>
              <label className='label'>
                <span className='label-text'>{t('bui-shared-primary-color')}</span>
              </label>
              <input
                type='color'
                id='primaryColor'
                onChange={onChange}
                value={branding.primaryColor || '#25c2a0'}
              />
              <label className='label'>
                <span className='label-text-alt'>{t('bui-shared-primary-color-desc')}</span>
              </label>
            </div>
            <div className='mt-5'>
              <ButtonPrimary loading={loading}>{t('bui-shared-save-changes')}</ButtonPrimary>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};
