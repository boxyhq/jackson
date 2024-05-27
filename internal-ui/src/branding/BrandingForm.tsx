import type { Branding, IdentityFederationApp } from '../types';
import { useTranslation } from 'next-i18next';
import { ButtonPrimary, Error, Loading } from '../shared';
import { useFormik } from 'formik';
import { useFetch } from '../hooks';

export const BrandingForm = ({
  defaults,
  urls,
  onUpdate,
  onError,
}: {
  defaults: Partial<Branding>;
  urls: { getBranding: string; patch?: string; post?: string };
  onUpdate?: (data: IdentityFederationApp | Branding) => void;
  onError?: (error: Error) => void;
}) => {
  const { t } = useTranslation('common');

  const {
    data,
    isLoading: isLoadingBranding,
    error,
  } = useFetch<{ data: Branding }>({
    url: urls.getBranding,
  });

  const branding = data?.data;

  const formik = useFormik<Branding>({
    initialValues: {
      logoUrl: branding?.logoUrl || '',
      faviconUrl: branding?.faviconUrl || '',
      companyName: branding?.companyName || '',
      primaryColor: branding?.primaryColor || defaults.primaryColor || '',
    },
    onSubmit: async (values) => {
      const rawResponse = await fetch(urls.patch ?? urls.post!, {
        method: urls.patch ? 'PATCH' : 'POST',
        body: JSON.stringify(values),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const response = await rawResponse.json();

      if (rawResponse.ok) {
        onUpdate?.(response.data);
      } else {
        onError?.(response.error);
      }
    },
    enableReinitialize: true,
  });

  if (isLoadingBranding) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error.message} />;
  }

  return (
    <>
      <h2 className='mt-5 font-bold text-gray-700 md:text-xl'>{t('settings_branding_title')}</h2>
      <p className='py-3 text-base leading-6 text-gray-800'>{t('settings_branding_description')}</p>
      <div className='rounded border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800'>
        <form onSubmit={formik.handleSubmit}>
          <div className='flex flex-col space-y-2'>
            <div className='form-control w-full md:w-1/2'>
              <label className='label'>
                <span className='label-text'>{t('bui-shared-logo-url')}</span>
              </label>
              <input
                type='url'
                id='logoUrl'
                className='input-bordered input'
                onChange={formik.handleChange}
                value={formik.values.logoUrl}
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
                onChange={formik.handleChange}
                value={formik.values.faviconUrl}
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
                onChange={formik.handleChange}
                value={formik.values.companyName}
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
                onChange={formik.handleChange}
                value={formik.values.primaryColor}
              />
              <label className='label'>
                <span className='label-text-alt'>{t('bui-shared-primary-color-desc')}</span>
              </label>
            </div>
            <div className='mt-5'>
              <ButtonPrimary loading={formik.isSubmitting} disabled={!formik.dirty || !formik.isValid}>
                {t('bui-shared-save-changes')}
              </ButtonPrimary>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};
