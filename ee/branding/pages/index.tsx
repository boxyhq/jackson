import type { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { ButtonPrimary } from '@components/ButtonPrimary';
import { errorToast, successToast } from '@components/Toaster';
import type { ApiResponse } from 'types';
import type { AdminPortalBranding } from '@boxyhq/saml-jackson';
import LicenseRequired from '@components/LicenseRequired';

const Branding: NextPage = () => {
  const { t } = useTranslation('common');
  const [loading, setLoading] = useState(false);
  const [isDarkThemeEnabled, setIsDarkThemeEnabled] = useState(false);
  const [branding, setBranding] = useState<AdminPortalBranding>({
    logoUrl: '',
    faviconUrl: '',
    companyName: '',
    primaryColor: '',
    backgroundColor: '',
    textColor: '',
    borderColor: '',
    darkTheme: {
      primaryColor: '',
      backgroundColor: '',
      textColor: '',
      borderColor: '',
      logoUrl: '',
    },
  });

  // Fetch settings
  const fetchSettings = async () => {
    const rawResponse = await fetch('/api/branding', {
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
    setIsDarkThemeEnabled(false);

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

    // to handle onChange handler for dark theme values
    if (target.id.startsWith('darkTheme')) {
      // split the id which is in the form "darkTheme.property"
      // in order to only get the property name
      const id = event.target.id.split('.')[1];

      setBranding({
        ...branding,
        darkTheme: {
          ...branding.darkTheme,
          [id]: target.value,
        },
      });

      return;
    }

    setBranding({
      ...branding,
      [target.id]: target.value,
    });
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <LicenseRequired>
      <h2 className='mt-5 font-bold text-gray-700 md:text-xl'>{t('settings_branding_title')}</h2>
      <p className='py-3 text-base leading-6 text-gray-800'>{t('settings_branding_description')}</p>
      <div className='rounded border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800'>
        <form onSubmit={onSubmit}>
          <div className='flex gap-3 mb-5 justify-between'>
            <h1 className='text-2xl font-bold'>Light theme</h1>
            <div className='flex items-center justify-center gap-3'>
              <h3 className='font-bold text-xl'>Enable dark theme</h3>
              <input
                type='checkbox'
                onChange={() => setIsDarkThemeEnabled(!isDarkThemeEnabled)}
                className='toggle toggle-md'
                checked={isDarkThemeEnabled}
              />
            </div>
          </div>
          <div className='flex flex-col space-y-2'>
            <div className='form-control w-full md:w-1/2'>
              <label className='label'>
                <span className='label-text'>{t('branding_favicon_url_label')}</span>
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
                <span className='label-text-alt'>{t('branding_favicon_url_alt')}</span>
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
            <div className='form-control w-full md:w-1/2'>
              <label className='label'>
                <span className='label-text'>{t('branding_logo_url_label')}</span>
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
                <span className='label-text-alt'>{t('branding_logo_url_alt')}</span>
              </label>
            </div>
            <div className='flex gap-7'>
              <div className='form-control'>
                <div className='flex'>
                  <label className='label pr-3'>
                    <span className='label-text'>{t('branding_primary_color_label')}</span>
                  </label>
                </div>
                <div className='flex gap-3 border-[1px] border-gray-200 rounded-md p-2 w-fit'>
                  <h3 className='border-r-[1px] border-gray-200 pr-2'>
                    {branding.primaryColor || '#000000'}
                  </h3>
                  <input
                    type='color'
                    id='primaryColor'
                    onChange={onChange}
                    value={branding.primaryColor || ''}
                  />
                </div>
              </div>
              <div className='form-control'>
                <div className='flex'>
                  <label className='label pr-3'>
                    <span className='label-text'>Background Color</span>
                  </label>
                </div>
                <div className='flex gap-3 border-[1px] border-gray-200 rounded-md p-2 w-fit'>
                  <h3 className='border-r-[1px] border-gray-200 pr-2'>
                    {branding.backgroundColor || '#000000'}
                  </h3>
                  <input
                    id='backgroundColor'
                    type='color'
                    onChange={onChange}
                    value={branding.backgroundColor || ''}
                  />
                </div>
              </div>
              <div className='form-control'>
                <div className='flex'>
                  <label className='label pr-3'>
                    <span className='label-text'>Text Color</span>
                  </label>
                </div>
                <div className='flex gap-3 border-[1px] border-gray-200 rounded-md p-2 w-fit'>
                  <h3 className='border-r-[1px] border-gray-200 pr-2'>{branding.textColor || '#000000'}</h3>
                  <input id='textColor' type='color' onChange={onChange} value={branding.textColor || ''} />
                </div>
              </div>
              <div className='form-control'>
                <div className='flex'>
                  <label className='label pr-3'>
                    <span className='label-text'>Border Color</span>
                  </label>
                </div>
                <div className='flex gap-3 border-[1px] border-gray-200 rounded-md p-2 w-fit'>
                  <h3 className='border-r-[1px] border-gray-200 pr-2'>{branding.borderColor || '#000000'}</h3>
                  <input
                    id='borderColor'
                    type='color'
                    onChange={onChange}
                    value={branding.borderColor || ''}
                  />
                </div>
              </div>
            </div>
            {/* Only to be displayed in case of dark theme state being set to true */}
            {isDarkThemeEnabled ? (
              <>
                <h1 className='text-2xl font-bold mt-5  pt-5'>Dark theme</h1>
                <div className='form-control w-full md:w-1/2'>
                  <label className='label'>
                    <span className='label-text'>{t('branding_logo_url_label')}</span>
                  </label>
                  <input
                    type='url'
                    id='darkTheme.logoUrl'
                    className='input-bordered input'
                    onChange={onChange}
                    value={branding.darkTheme?.logoUrl || ''}
                    placeholder='https://company.com/logo.png'
                  />
                  <label className='label'>
                    <span className='label-text-alt'>{t('branding_logo_url_alt')}</span>
                  </label>
                </div>
                <div className='flex gap-7'>
                  <div className='form-control'>
                    <div className='flex'>
                      <label className='label pr-3'>
                        <span className='label-text'>{t('branding_primary_color_label')}</span>
                      </label>
                    </div>
                    <div className='flex gap-3 border-[1px] border-gray-200 rounded-md p-2 w-fit'>
                      <h3 className='border-r-[1px] border-gray-200 pr-2'>
                        {/* Not sure exactly what the default primary color should be in this case, since default
                        color for primary color is #25c2a0 so '#124f45' since its a darker shade of that */}
                        {branding.darkTheme?.primaryColor || '#124f45'}
                      </h3>
                      <input
                        type='color'
                        id='darkTheme.primaryColor'
                        onChange={onChange}
                        value={branding.darkTheme?.primaryColor || ''}
                      />
                    </div>
                  </div>
                  <div className='form-control'>
                    <div className='flex'>
                      <label className='label pr-3'>
                        <span className='label-text'>Background Color</span>
                      </label>
                    </div>
                    <div className='flex gap-3 border-[1px] border-gray-200 rounded-md p-2 w-fit'>
                      <h3 className='border-r-[1px] border-gray-200 pr-2'>
                        {branding.darkTheme?.backgroundColor || '#18181b'}
                      </h3>
                      <input
                        id='darkTheme.backgroundColor'
                        type='color'
                        onChange={onChange}
                        value={branding.darkTheme?.backgroundColor || ''}
                      />
                    </div>
                  </div>
                  <div className='form-control'>
                    <div className='flex'>
                      <label className='label pr-3'>
                        <span className='label-text'>Text color</span>
                      </label>
                    </div>
                    <div className='flex gap-3 border-[1px] border-gray-200 rounded-md p-2 w-fit'>
                      <h3 className='border-r-[1px] border-gray-200 pr-2'>
                        {branding.darkTheme?.textColor || '#f4f4f5'}
                      </h3>
                      <input
                        id='darkTheme.textColor'
                        type='color'
                        onChange={onChange}
                        value={branding.darkTheme?.textColor || ''}
                      />
                    </div>
                  </div>
                  <div className='form-control'>
                    <div className='flex'>
                      <label className='label pr-3'>
                        <span className='label-text'>Border color</span>
                      </label>
                    </div>
                    <div className='flex gap-3 border-[1px] border-gray-200 rounded-md p-2 w-fit'>
                      <h3 className='border-r-[1px] border-gray-200 pr-2'>
                        {branding.darkTheme?.borderColor || '#e5e7eb'}
                      </h3>
                      <input
                        id='darkTheme.borderColor'
                        type='color'
                        onChange={onChange}
                        value={branding.darkTheme?.borderColor || ''}
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : null}
            <div>
              <ButtonPrimary className='mt-5' loading={loading}>
                {t('save_changes')}
              </ButtonPrimary>
            </div>
          </div>
        </form>
      </div>
    </LicenseRequired>
  );
};

export default Branding;
