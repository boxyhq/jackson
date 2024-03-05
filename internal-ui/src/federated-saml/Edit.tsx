import { Button } from 'react-daisyui';
import type { SAMLFederationApp } from '../types';
import TagsInput from 'react-tagsinput';
import { useTranslation } from 'next-i18next';
import { useFormik } from 'formik';
import { Card } from '../shared';
import { defaultHeaders } from '../utils';
import { ItemList } from '../shared/ItemList';

type EditApp = Pick<SAMLFederationApp, 'name' | 'acsUrl' | 'tenants' | 'redirectUrl'>;

export const Edit = ({
  app,
  urls,
  onError,
  onUpdate,
  excludeFields,
}: {
  app: SAMLFederationApp;
  urls: { patch: string };
  onUpdate?: (data: SAMLFederationApp) => void;
  onError?: (error: Error) => void;
  excludeFields?: 'product'[];
}) => {
  const { t } = useTranslation('common');

  const connectionIsOIDC = app.type === 'oidc';
  const connectionIsSAML = !connectionIsOIDC;

  const formik = useFormik<EditApp>({
    enableReinitialize: true,
    initialValues: {
      name: app.name || '',
      acsUrl: app.acsUrl || '',
      tenants: app.tenants || [],
      redirectUrl: app.redirectUrl || [],
    },
    onSubmit: async (values) => {
      const rawResponse = await fetch(urls.patch, {
        method: 'PATCH',
        body: JSON.stringify({ ...values, id: app.id }),
        headers: defaultHeaders,
      });

      const response = await rawResponse.json();

      if (rawResponse.ok) {
        onUpdate?.(response.data);
      } else {
        onError?.(response.error);
      }
    },
  });

  return (
    <>
      <div className='flex flex-col gap-6'>
        <form onSubmit={formik.handleSubmit} method='POST'>
          <Card>
            <Card.Body>
              <div className='flex flex-col space-y-3'>
                <label className='form-control w-full'>
                  <div className='label'>
                    <span className='label-text'>{t('bui-shared-name')}</span>
                  </div>
                  <input
                    type='text'
                    placeholder='Your app'
                    className='input input-bordered w-full text-sm'
                    name='name'
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    required
                  />
                </label>
                <label className='form-control w-full'>
                  <div className='label'>
                    <span className='label-text'>{t('bui-shared-tenant')}</span>
                  </div>
                  <input
                    type='text'
                    className='input input-bordered w-full text-sm'
                    value={app.tenant}
                    disabled
                  />
                </label>
                {!excludeFields?.includes('product') && (
                  <label className='form-control w-full'>
                    <div className='label'>
                      <span className='label-text'>{t('bui-shared-product')}</span>
                    </div>
                    <input
                      type='text'
                      className='input input-bordered w-full text-sm'
                      value={app.product}
                      disabled
                    />
                  </label>
                )}
                {connectionIsOIDC && (
                  <label className='form-control w-full'>
                    <div className='label'>
                      <span className='label-text'>{t('bui-fs-client-id')}</span>
                    </div>
                    <input
                      type='text'
                      className='input-bordered input'
                      defaultValue={app.clientID}
                      disabled
                    />
                  </label>
                )}
                {connectionIsOIDC && (
                  <label className='form-control w-full'>
                    <div className='label'>
                      <span className='label-text'>{t('bui-fs-client-secret')}</span>
                    </div>
                    <input
                      type='text'
                      className='input-bordered input'
                      defaultValue={app.clientSecret}
                      disabled
                    />
                  </label>
                )}
                {connectionIsSAML && (
                  <label className='form-control w-full'>
                    <div className='label'>
                      <span className='label-text'>{t('bui-fs-entity-id')}</span>
                    </div>
                    <input
                      type='text'
                      className='input input-bordered w-full text-sm'
                      value={app.entityId}
                      disabled
                    />
                    <label className='label'>
                      <span className='label-text-alt'>{t('bui-fs-entity-id-edit-desc')}</span>
                    </label>
                  </label>
                )}
                {connectionIsSAML && (
                  <label className='form-control w-full'>
                    <div className='label'>
                      <span className='label-text'>{t('bui-fs-acs-url')}</span>
                    </div>
                    <input
                      type='url'
                      placeholder='https://your-sp.com/saml/acs'
                      className='input input-bordered w-full text-sm'
                      name='acsUrl'
                      value={formik.values.acsUrl}
                      onChange={formik.handleChange}
                      required
                    />
                  </label>
                )}
                {connectionIsOIDC && (
                  <label className='form-control w-full'>
                    <div className='label'>
                      <span className='label-text'>{t('bui-sl-allowed-redirect-urls-new')}</span>
                    </div>
                    <ItemList
                      currentlist={formik.values.redirectUrl || ['']}
                      onItemListChange={(newList) => formik.setFieldValue('redirectUrl', newList)}></ItemList>
                  </label>
                )}
                <label className='form-control w-full'>
                  <label className='label'>
                    <span className='label-text'>{t('bui-fs-tenants')}</span>
                  </label>
                  <TagsInput
                    value={formik.values.tenants}
                    onChange={(tags: string[]) => formik.setFieldValue('tenants', tags)}
                    onlyUnique={true}
                    inputProps={{
                      placeholder: t('bui-fs-enter-tenant'),
                    }}
                    focusedClassName='input-focused'
                    addOnBlur={true}
                  />
                  <label className='label'>
                    <span className='label-text-alt'>{t('bui-fs-tenants-mapping-desc')}</span>
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
                {t('bui-shared-save-changes')}
              </Button>
            </Card.Footer>
          </Card>
        </form>
      </div>
    </>
  );
};
