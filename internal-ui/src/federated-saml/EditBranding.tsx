import { Button } from 'react-daisyui';
import { useTranslation } from 'next-i18next';
import { SAMLFederationApp } from '@boxyhq/saml-jackson';
import { useFormik } from 'formik';
import { defaultHeaders } from '@/utils/request';
import { Card } from '@/shared';

type Branding = Pick<SAMLFederationApp, 'logoUrl' | 'faviconUrl' | 'primaryColor'>;

export const EditBranding = ({
  app,
  urls,
  onSuccess,
  onError,
}: {
  app: Branding;
  urls: { patch: string };
  onSuccess?: (data: SAMLFederationApp) => void;
  onError?: (error: Error) => void;
}) => {
  const { t } = useTranslation('common');

  const formik = useFormik<Branding>({
    enableReinitialize: true,
    initialValues: {
      logoUrl: app.logoUrl,
      faviconUrl: app.faviconUrl,
      primaryColor: app.primaryColor || '#25c2a0',
    },
    onSubmit: async (values) => {
      const rawResponse = await fetch(urls.patch, {
        method: 'PATCH',
        body: JSON.stringify(values),
        headers: defaultHeaders,
      });

      const response = await rawResponse.json();

      if (rawResponse.ok) {
        onSuccess?.(response.data);
      } else {
        onError?.(response.error);
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} method='POST'>
      <Card>
        <Card.Body>
          <Card.Header>
            <Card.Title>{t('bui-fs-edit-branding-title')}</Card.Title>
            <Card.Description>{t('bui-fs-edit-branding-desc')}</Card.Description>
          </Card.Header>
          <div className='flex flex-col'>
            <label className='form-control w-full'>
              <div className='label'>
                <span className='label-text'>{t('bui-fs-logo-url')}</span>
              </div>
              <input
                type='url'
                placeholder='https://your-app.com/logo.png'
                className='input input-bordered w-full text-sm'
                name='logoUrl'
                value={formik.values.logoUrl || ''}
                onChange={formik.handleChange}
              />
              <label className='label'>
                <span className='label-text-alt'>{t('bui-fs-favicon-url-desc')}</span>
              </label>
            </label>
            <label className='form-control w-full'>
              <div className='label'>
                <span className='label-text'>{t('bui-fs-favicon-url')}</span>
              </div>
              <input
                type='url'
                placeholder='https://your-app.com/favicon.ico'
                className='input input-bordered w-full text-sm'
                name='faviconUrl'
                value={formik.values.faviconUrl || ''}
                onChange={formik.handleChange}
              />
              <label className='label'>
                <span className='label-text-alt'>{t('bui-fs-favicon-url-desc')}</span>
              </label>
            </label>
            <label className='form-control'>
              <div className='flex'>
                <label className='label pr-3'>
                  <span className='label-text'>{t('bui-fs-primary-color')}</span>
                </label>
              </div>
              <div className='flex gap-3 border-[1px] border-gray-200 rounded-md p-2 w-fit'>
                <h3 className='border-r-[1px] border-gray-200 pr-2'>{formik.values.primaryColor}</h3>
                <input
                  type='color'
                  name='primaryColor'
                  onChange={formik.handleChange}
                  value={formik.values.primaryColor || '#25c2a0'}
                />
              </div>
              <label className='label'>
                <span className='label-text-alt'>{t('bui-fs-primary-color-desc')}</span>
              </label>
            </label>
          </div>
        </Card.Body>
        <Card.Footer>
          <Button
            type='submit'
            className='btn btn-primary btn-md'
            loading={formik.isSubmitting}
            disabled={!formik.dirty || !formik.isValid}>
            {t('bui-fs-save-changes')}
          </Button>
        </Card.Footer>
      </Card>
    </form>
  );
};
