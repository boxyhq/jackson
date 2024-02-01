import type { AdminPortalBranding, SAMLFederationApp } from '@boxyhq/saml-jackson';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import TagsInput from 'react-tagsinput';

import { fetcher } from '@lib/ui/utils';
import Loading from '@components/Loading';
import { errorToast, successToast } from '@components/Toaster';
import ConfirmationModal from '@components/ConfirmationModal';
import type { ApiError, ApiResponse, ApiSuccess } from 'types';
import { LinkBack } from '@components/LinkBack';
import { ButtonPrimary } from '@components/ButtonPrimary';
import { ButtonDanger } from '@components/ButtonDanger';
import { LinkOutline } from '@components/LinkOutline';
import LicenseRequired from '@components/LicenseRequired';

import 'react-tagsinput/react-tagsinput.css';

const UpdateApp = ({ hasValidLicense }: { hasValidLicense: boolean }) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [app, setApp] = useState<SAMLFederationApp & Omit<AdminPortalBranding, 'companyName'>>({
    id: '',
    name: '',
    tenant: '',
    product: '',
    acsUrl: '',
    entityId: '',
    logoUrl: '',
    faviconUrl: '',
    primaryColor: '',
    tenants: [],
  });

  const { id } = router.query as { id: string };

  const { data, error, isLoading, mutate } = useSWR<ApiSuccess<SAMLFederationApp>, ApiError>(
    `/api/admin/federated-saml/${id}`,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  useEffect(() => {
    if (data) {
      setApp(data.data);
    }
  }, [data]);

  if (!hasValidLicense) {
    return <LicenseRequired />;
  }

  if (error) {
    errorToast(error.message);
    return null;
  }

  if (isLoading) {
    return <Loading />;
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);

    const rawResponse = await fetch(`/api/admin/federated-saml/${app.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(app),
    });

    setLoading(false);

    const response: ApiResponse<SAMLFederationApp> = await rawResponse.json();

    if ('error' in response) {
      errorToast(response.error.message);
      return;
    }

    if ('data' in response) {
      mutate();
      successToast(t('saml_federation_update_success'));
    }
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = event.target as HTMLInputElement;

    setApp({
      ...app,
      [target.id]: target.value,
    });
  };

  return (
    <>
      <LinkBack href='/admin/federated-saml' />
      <div className='mb-5 flex items-center justify-between'>
        <h2 className='mt-5 font-bold text-gray-700 md:text-xl'>{t('saml_federation_update_app')}</h2>
        <div>
          <LinkOutline href={'/.well-known/idp-configuration'} target='_blank' className='m-2'>
            {t('view_idp_configuration')}
          </LinkOutline>
        </div>
      </div>
      <div className='rounded border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800'>
        <form onSubmit={onSubmit}>
          <div className='space-y-3'>
            <div className='form-control w-full md:w-1/2'>
              <label className='label'>
                <span className='label-text'>{t('tenant')}</span>
              </label>
              <input type='text' className='input-bordered input' defaultValue={app.tenant} disabled />
            </div>
            <div className='form-control w-full md:w-1/2'>
              <label className='label'>
                <span className='label-text'>{t('product')}</span>
              </label>
              <input type='text' className='input-bordered input' defaultValue={app.product} disabled />
            </div>
            <div className='form-control w-full md:w-1/2'>
              <label className='label'>
                <span className='label-text'>{t('entity_id')}</span>
              </label>
              <input type='url' className='input-bordered input' defaultValue={app.entityId} disabled />
            </div>
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
                value={app.name}
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
                value={app.acsUrl}
              />
            </div>
            <div className='form-control w-full md:w-1/2'>
              <label className='label'>
                <span className='label-text'>{t('tenants')}</span>
              </label>
              <TagsInput
                value={app.tenants || []}
                onChange={(tags) => setApp({ ...app, tenants: tags })}
                onlyUnique={true}
                inputProps={{
                  placeholder: t('enter_tenant'),
                }}
                focusedClassName='input-focused'
                addOnBlur={true}
              />
              <label className='label'>
                <span className='label-text-alt'>{t('tenants_mapping_description')}</span>
              </label>
            </div>
            <div className='pt-4'>
              <p className='text-base leading-6 text-gray-500'>{t('customize_branding')}:</p>
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
                placeholder='https://company.com/logo.png'
                value={app.logoUrl || ''}
              />
              <label className='label'>
                <span className='label-text-alt'>{t('branding_logo_url_alt')}</span>
              </label>
            </div>
            <div className='form-control w-full md:w-1/2'>
              <label className='label'>
                <span className='label-text'>{t('branding_favicon_url_label')}</span>
              </label>
              <input
                type='url'
                id='faviconUrl'
                className='input-bordered input'
                onChange={onChange}
                placeholder='https://company.com/favicon.ico'
                value={app.faviconUrl || ''}
              />
              <label className='label'>
                <span className='label-text-alt'>{t('branding_favicon_url_alt')}</span>
              </label>
            </div>
            <div className='form-control'>
              <label className='label'>
                <span className='label-text'>{t('branding_primary_color_label')}</span>
              </label>
              <input type='color' id='primaryColor' onChange={onChange} value={app.primaryColor || ''} />
              <label className='label'>
                <span className='label-text-alt'>{t('branding_primary_color_alt')}</span>
              </label>
            </div>
            <div>
              <ButtonPrimary type='submit' loading={loading}>
                {t('save_changes')}
              </ButtonPrimary>
            </div>
          </div>
        </form>
      </div>
      <DeleteApp app={app} />
    </>
  );
};

export const DeleteApp = ({ app }: { app: SAMLFederationApp }) => {
  const { t } = useTranslation('common');
  const [delModalVisible, setDelModalVisible] = useState(false);

  const deleteApp = async () => {
    const rawResponse = await fetch(`/api/admin/federated-saml/${app.id}`, {
      method: 'DELETE',
    });

    const response: ApiResponse<unknown> = await rawResponse.json();

    if ('error' in response) {
      errorToast(response.error.message);
      return;
    }

    if ('data' in response) {
      successToast(t('saml_federation_delete_success'));
      window.location.href = '/admin/federated-saml';
    }
  };

  return (
    <>
      <section className='mt-5 flex items-center rounded bg-red-100 p-6 text-red-900'>
        <div className='flex-1'>
          <h6 className='mb-1 font-medium'>{t('delete_this_saml_federation_app')}</h6>
          <p className='font-light'>{t('all_your_apps_using_this_connection_will_stop_working')}</p>
        </div>
        <ButtonDanger
          type='button'
          data-modal-toggle='popup-modal'
          onClick={() => {
            setDelModalVisible(true);
          }}>
          {t('delete')}
        </ButtonDanger>
      </section>
      <ConfirmationModal
        title={t('delete_the_saml_federation_app')}
        description={t('confirmation_modal_description')}
        visible={delModalVisible}
        onConfirm={deleteApp}
        onCancel={() => {
          setDelModalVisible(false);
        }}
      />
    </>
  );
};

export default UpdateApp;
