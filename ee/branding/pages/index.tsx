import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { ButtonPrimary } from '@boxyhq/internal-ui';
import { errorToast, successToast } from '@components/Toaster';
import type { ApiResponse } from 'types';
import type { AdminPortalBranding } from '@boxyhq/saml-jackson';
import LicenseRequired from '@components/LicenseRequired';

const Branding = ({ hasValidLicense }: { hasValidLicense: boolean }) => {
  const { t } = useTranslation('common');
  const [loading, setLoading] = useState(false);
  const [branding, setBranding] = useState<AdminPortalBranding>({
    logoUrl: '',
    faviconUrl: '',
    companyName: '',
    primaryColor: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  // Fetch settings
  const fetchSettings = async () => {
    const rawResponse = await fetch('/api/admin/branding', {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response: ApiResponse<AdminPortalBranding> = await rawResponse.json();

    if ('data' in response) {
      setBranding(response.data);
    }
  };

  // Update settings
  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);

    const rawResponse = await fetch('/api/admin/branding', {
      method: 'POST',
      body: JSON.stringify(branding),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    setLoading(false);

    const response: ApiResponse<AdminPortalBranding> = await rawResponse.json();

    if ('error' in response) {
      errorToast(response.error.message);
      return;
    }

    if ('data' in response) {
      successToast(t('settings_updated_successfully'));
    }
  };

  // Handle input change
  const onChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = event.target as HTMLInputElement;

    setBranding({
      ...branding,
      [target.id]: target.value,
    });
  };

  if (!hasValidLicense) {
    return <LicenseRequired />;
  }

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
              <input type='color' id='primaryColor' onChange={onChange} value={branding.primaryColor || ''} />
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

export default Branding;
