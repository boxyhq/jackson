import { FormEvent, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import type { SAMLFederationApp } from '@boxyhq/saml-jackson';
import TagsInput from 'react-tagsinput';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

import type { ApiResponse } from 'types';
import { LinkBack } from '@components/LinkBack';
import { ButtonPrimary } from '@components/ButtonPrimary';
import { errorToast, successToast } from '@components/Toaster';
import LicenseRequired from '@components/LicenseRequired';
import { copyToClipboard } from '@lib/ui/utils';

import 'react-tagsinput/react-tagsinput.css';

const NewApp = ({ hasValidLicense, samlAudience }: { hasValidLicense: boolean; samlAudience: string }) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [newApp, setApp] = useState<{
    type: 'saml' | 'oidc';
    redirectUrlText: string;
    redirectUrl?: string[] | string;
    name?: string;
    tenant: string;
    product: string;
    acsUrl: string;
    entityId: string;
    tenants: string[];
    mappings: string[];
  }>({
    type: 'saml',
    redirectUrlText: '',
    name: '',
    tenant: '',
    product: '',
    acsUrl: '',
    entityId: '',
    tenants: [],
    mappings: [],
  });

  const handleNewConnectionTypeChange = (event) => {
    setApp({ ...newApp, type: event.target.value });
  };

  const connectionIsSAML = newApp.type === 'saml';
  const connectionIsOIDC = newApp.type === 'oidc';

  if (!hasValidLicense) {
    return <LicenseRequired />;
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const redirectUrlList = (newApp.redirectUrlText as string)?.split(/\r\n|\r|\n/);

    newApp.redirectUrl = newApp.redirectUrlText && redirectUrlList ? redirectUrlList : undefined;

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

  const generateEntityId = () => {
    const id = crypto.randomUUID().replace(/-/g, '');
    const entityId = `${samlAudience}/${id}`;
    setApp({ ...newApp, entityId });
    copyToClipboard(entityId);
    successToast(t('entity_id_generated_copied'));
  };

  return (
    <>
      <LinkBack href='/admin/federated-saml' />
      <h2 className='mb-5 mt-5 font-bold text-gray-700 md:text-xl'>{t('saml_federation_add_new_app')}</h2>
      <div className='rounded border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800'>
        <div className='mb-4 flex items-center'>
          <div className='mr-2 py-3'>{t('select_app_type')}:</div>
          <div className='flex w-52'>
            <div className='form-control'>
              <label className='label mr-4 cursor-pointer'>
                <input
                  type='radio'
                  name='connection'
                  value='saml'
                  className='radio-primary radio'
                  checked={newApp.type === 'saml'}
                  onChange={handleNewConnectionTypeChange}
                />
                <span className='label-text ml-1'>{t('saml')}</span>
              </label>
            </div>
            <div className='form-control'>
              <label className='label mr-4 cursor-pointer' data-testid='sso-type-oidc'>
                <input
                  type='radio'
                  name='connection'
                  value='oidc'
                  className='radio-primary radio'
                  checked={newApp.type === 'oidc'}
                  onChange={handleNewConnectionTypeChange}
                />
                <span className='label-text ml-1'>{t('oidc')}</span>
              </label>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit}>
          <div className='flex flex-col space-y-3'>
            <p className='text-sm leading-6 text-gray-800'>{t('saml_federation_add_new_app_description')}</p>
            <div className='form-control w-full'>
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
            <div className='form-control w-full'>
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
            <div className='form-control w-full'>
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
            {connectionIsSAML && (
              <div className='form-control w-full'>
                <label className='label'>
                  <span className='label-text'>{t('acs_url')}</span>
                </label>
                <input
                  type='url'
                  id='acsUrl'
                  className='input-bordered input'
                  required
                  onChange={onChange}
                  placeholder='https://your-sp.com/saml/acs'
                />
              </div>
            )}
            {connectionIsOIDC && (
              <div className='form-control w-full'>
                <label className='label'>
                  <span className='label-text'>{t('allowed_redirect_url')}</span>
                </label>
                <textarea
                  placeholder={'http://localhost:3366'}
                  value={newApp.redirectUrlText}
                  // required={required}
                  // readOnly={readOnly}
                  // maxLength={maxLength}
                  onChange={(event: FormEvent) => {
                    const target = event.target as HTMLTextAreaElement;
                    setApp({ ...newApp, redirectUrlText: target.value });
                  }}
                  className={'textarea-bordered textarea h-24 w-full' + 'whitespace-pre'}
                  rows={3}
                />
              </div>
            )}
            {connectionIsSAML && (
              <label className='form-control w-full'>
                <div className='label'>
                  <span className='label-text'>{t('entity_id')}</span>
                  <span className='label-text-alt'>
                    <div className='flex items-center gap-1'>
                      <span
                        className='cursor-pointer border-stone-600 border p-1 rounded'
                        onClick={generateEntityId}>
                        {t('generate_sp_entity_id')}
                      </span>
                      <div
                        className='tooltip tooltip-left'
                        data-tip={t('saml_federation_entity_id_instruction')}>
                        <QuestionMarkCircleIcon className='h-5 w-5' />
                      </div>
                    </div>
                  </span>
                </div>
                <input
                  type='text'
                  className='input input-bordered w-full'
                  id='entityId'
                  placeholder='https://your-sp.com/saml/entityId'
                  required
                  value={newApp.entityId}
                  onChange={onChange}
                />
                <label className='label'>
                  <span className='label-text-alt'>{t('entity-id-change-restriction')}</span>
                </label>
              </label>
            )}
            <div className='form-control w-full'>
              <label className='label'>
                <span className='label-text'>{t('tenants')}</span>
              </label>
              <TagsInput
                value={newApp.tenants}
                onChange={(tags) => setApp({ ...newApp, tenants: tags })}
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
            <div>
              <ButtonPrimary loading={loading}>{t('create_app')}</ButtonPrimary>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default NewApp;
