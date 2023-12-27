import { FormEvent, useState } from 'react';
import ConfirmationModal from '@components/ConfirmationModal';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { errorToast, successToast } from '@components/Toaster';
import { ButtonPrimary } from '../ButtonPrimary';
import { LinkBack } from '../LinkBack';
import { InputWithCopyButton } from '../ClipboardButton';
import type { SetupLinkService, SetupLink } from '@boxyhq/saml-jackson';
import type { ApiResponse } from 'types';

const CreateSetupLink = ({ service }: { service: SetupLinkService }) => {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [loading, setLoading] = useState(false);
  const [loading1, setLoading1] = useState(false);
  const [delModalVisible, setDelModalVisible] = useState(false);

  const [setupLink, setSetupLink] = useState<SetupLink | null>(null);
  const [formObj, setFormObj] = useState({
    tenant: '',
    product: '',
    service,
    name: '',
    description: '',
    defaultRedirectUrl: '',
    redirectUrl: '',
  });

  // Create a new setup link
  const createSetupLink = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);

    const rawResponse = await fetch('/api/admin/setup-links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formObj),
    });

    setLoading(false);

    const response: ApiResponse<SetupLink> = await rawResponse.json();

    if ('error' in response) {
      errorToast(response.error.message);
      return;
    }

    if (rawResponse.ok) {
      setSetupLink(response.data);
      successToast(t('link_generated'));
    }
  };

  // Regenerate setup link
  const regenerateSetupLink = async () => {
    setLoading1(true);
    setDelModalVisible(!delModalVisible);

    const res = await fetch('/api/admin/setup-links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...formObj,
        regenerate: true,
      }),
    });
    if (res.ok) {
      setLoading1(false);
      const json = await res.json();
      setSetupLink(json.data);
      successToast(t('link_regenerated'));
    } else {
      setLoading1(false);
      errorToast(t('server_error'));
    }
  };

  const handleChange = (event: FormEvent) => {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    setFormObj((cur) => ({ ...cur, [target.name]: target.value }));
  };

  const toggleDelConfirm = () => setDelModalVisible(!delModalVisible);

  const buttonDisabled = !formObj.tenant || !formObj.product || !formObj.service;

  return (
    <>
      <LinkBack onClick={() => router.back()} />
      <div className='mt-5 min-w-[28rem] rounded border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800'>
        <h2 className='mb-5 font-bold text-gray-700 dark:text-white md:text-xl'>
          {t('create_setup_link', {
            service: service === 'sso' ? t('enterprise_sso') : t('directory_sync'),
          })}
        </h2>
        <form onSubmit={createSetupLink} method='POST'>
          <div>
            <div className='mb-6'>
              <label
                htmlFor='tenant'
                className={`mb-2 block text-sm font-medium text-gray-900 dark:text-gray-300`}>
                {t('tenant')}
              </label>
              <input
                id='tenant'
                name='tenant'
                type='text'
                placeholder='acme.com'
                value={formObj['tenant']}
                onChange={handleChange}
                className='input-bordered input w-full'
                required
              />
            </div>
            <div className='mb-6'>
              <label
                htmlFor='product'
                className={`mb-2 block text-sm font-medium text-gray-900 dark:text-gray-300`}>
                {t('product')}
              </label>
              <input
                id='product'
                name='product'
                type='text'
                placeholder='demo'
                value={formObj['product']}
                onChange={handleChange}
                className='input-bordered input w-full'
                required
              />
            </div>
            {service === 'sso' && (
              <>
                <div className='mb-6'>
                  <label
                    htmlFor='name'
                    className={`mb-2 block text-sm font-medium text-gray-900 dark:text-gray-300`}>
                    {t('name')}
                  </label>
                  <input
                    id='name'
                    name='name'
                    type='text'
                    placeholder='MyApp'
                    value={formObj['name']}
                    onChange={handleChange}
                    className='input-bordered input w-full'
                  />
                </div>
                <div className='mb-6'>
                  <label
                    htmlFor='description'
                    className={`mb-2 block text-sm font-medium text-gray-900 dark:text-gray-300`}>
                    {t('description')}
                  </label>
                  <input
                    id='description'
                    name='description'
                    type='text'
                    placeholder='A short description not more than 100 characters'
                    value={formObj['description']}
                    onChange={handleChange}
                    className='input-bordered input w-full'
                  />
                </div>
                <div className='mb-6'>
                  <label
                    htmlFor='defaultRedirectUrl'
                    className={`mb-2 block text-sm font-medium text-gray-900 dark:text-gray-300`}>
                    {t('default_redirect_url')}
                  </label>
                  <input
                    id='defaultRedirectUrl'
                    name='defaultRedirectUrl'
                    type='url'
                    placeholder='http://localhost:3366/login/saml'
                    value={formObj['defaultRedirectUrl']}
                    onChange={handleChange}
                    className='input-bordered input w-full'
                    required
                  />
                </div>
                <div className='mb-6'>
                  <label
                    htmlFor='redirectUrl'
                    className={`mb-2 block text-sm font-medium text-gray-900 dark:text-gray-300`}>
                    {t('allowed_redirect_url')}
                  </label>
                  <textarea
                    id={'redirectUrl'}
                    name='redirectUrl'
                    placeholder={t('allowed_redirect_url')}
                    value={formObj['redirectUrl']}
                    required
                    onChange={handleChange}
                    className={`whitespace-pre} textarea-bordered textarea h-24 w-full`}
                    rows={3}
                  />
                </div>
              </>
            )}
          </div>
          <div className='flex'>
            <ButtonPrimary loading={loading} disabled={buttonDisabled}>
              {t('generate')}
            </ButtonPrimary>
          </div>
        </form>
        <ConfirmationModal
          title={t('regenerate_setup_link')}
          description={t('regenerate_setup_link_description')}
          visible={delModalVisible}
          onConfirm={regenerateSetupLink}
          onCancel={toggleDelConfirm}
          actionButtonText={t('regenerate')}
        />
      </div>
      {setupLink && (
        <div className='mt-5 min-w-[28rem] rounded border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800'>
          <h2 className='mb-5 font-bold text-gray-700 dark:text-white md:text-xl'>
            {setupLink
              ? t('setup_link_info')
              : t('create_setup_link', {
                  service: service === 'sso' ? t('enterprise_sso') : t('directory_sync'),
                })}
          </h2>
          <div className='form-control'>
            <InputWithCopyButton text={setupLink.url} label={t('setup_link_url')} />
          </div>
          <div className='mt-5 flex'>
            <ButtonPrimary
              loading={loading1}
              disabled={buttonDisabled}
              onClick={
                setupLink
                  ? () => {
                      setDelModalVisible(true);
                    }
                  : createSetupLink
              }>
              {setupLink ? t('regenerate') : t('generate')}
            </ButtonPrimary>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateSetupLink;
