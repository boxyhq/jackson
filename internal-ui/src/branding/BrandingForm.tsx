import type { Branding, IdentityFederationApp } from '../types';
import { useTranslation } from 'next-i18next';
import { ButtonPrimary, Card, Error, Loading } from '../shared';
import { useFormik } from 'formik';
import { useFetch } from '../hooks';

export const BrandingForm = ({
  defaults,
  urls,
  onUpdate,
  onError,
  title,
  description,
  hideFields,
  federatedAppId,
}: {
  defaults: Partial<Branding>;
  urls: { getBranding?: string; patch?: string; post?: string };
  onUpdate?: (data: IdentityFederationApp | Branding) => void;
  onError?: (error: Error) => void;
  title?: string;
  description?: string;
  hideFields?: Partial<{ [key in keyof Branding]: boolean }>;
  federatedAppId?: string;
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
      logoUrl: branding?.logoUrl || defaults.logoUrl || '',
      faviconUrl: branding?.faviconUrl || defaults.faviconUrl || '',
      companyName: branding?.companyName || defaults.companyName || '',
      primaryColor: branding?.primaryColor || defaults.primaryColor || '',
    },
    onSubmit: async (values) => {
      const rawResponse = await fetch(urls.patch ?? urls.post!, {
        method: urls.patch ? 'PATCH' : 'POST',
        body: JSON.stringify({ ...values, id: federatedAppId }),
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

  const isFieldEnabled = (field: keyof Branding) => {
    if (hideFields?.[field] === true) {
      return false;
    }
    return true;
  };

  if (isLoadingBranding) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error.message} />;
  }

  return (
    <form onSubmit={formik.handleSubmit}>
      <Card>
        <Card.Body>
          <Card.Header>
            {title && <Card.Title>{title}</Card.Title>}
            {description && <Card.Description>{description}</Card.Description>}
          </Card.Header>
          <div className='flex flex-col'>
            {isFieldEnabled('logoUrl') && (
              <div className='form-control w-full'>
                <label className='label' htmlFor='logoUrl'>
                  <span className='label-text'>{t('bui-shared-logo-url')}</span>
                </label>
                <input
                  type='url'
                  id='logoUrl'
                  className='input-bordered input text-sm'
                  onChange={formik.handleChange}
                  value={formik.values.logoUrl}
                  placeholder='https://company.com/logo.png'
                />
                <div className='label'>
                  <span className='label-text-alt'>{t('bui-shared-logo-url-desc')}</span>
                </div>
              </div>
            )}
            {isFieldEnabled('faviconUrl') && (
              <div className='form-control w-full'>
                <label className='label' htmlFor='faviconUrl'>
                  <span className='label-text'>{t('bui-shared-favicon-url')}</span>
                </label>
                <input
                  type='url'
                  id='faviconUrl'
                  className='input-bordered input text-sm'
                  onChange={formik.handleChange}
                  value={formik.values.faviconUrl}
                  placeholder='https://company.com/favicon.ico'
                />
                <div className='label'>
                  <span className='label-text-alt'>{t('bui-shared-favicon-url-desc')}</span>
                </div>
              </div>
            )}
            {isFieldEnabled('companyName') && (
              <div className='form-control w-full'>
                <label className='label' htmlFor='companyName'>
                  <span className='label-text'>{t('branding_company_name_label')}</span>
                </label>
                <input
                  type='text'
                  id='companyName'
                  className='input-bordered input text-sm'
                  onChange={formik.handleChange}
                  value={formik.values.companyName}
                  placeholder={t('branding_company_name_label')}
                />
                <div className='label'>
                  <span className='label-text-alt'>{t('branding_company_name_alt')}</span>
                </div>
              </div>
            )}
            {isFieldEnabled('primaryColor') && (
              <div className='form-control'>
                <label className='label' htmlFor='primaryColor'>
                  <span className='label-text'>{t('bui-shared-primary-color')}</span>
                </label>
                <input
                  type='color'
                  id='primaryColor'
                  onChange={formik.handleChange}
                  value={formik.values.primaryColor}
                />
                <div className='label'>
                  <span className='label-text-alt'>{t('bui-shared-primary-color-desc')}</span>
                </div>
              </div>
            )}
          </div>
        </Card.Body>
        <Card.Footer>
          <ButtonPrimary loading={formik.isSubmitting} disabled={!formik.dirty || !formik.isValid}>
            {t('bui-shared-save-changes')}
          </ButtonPrimary>
        </Card.Footer>
      </Card>
    </form>
  );
};
