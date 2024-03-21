import { useRouter } from 'next/router';
import React from 'react';
import { useTranslation } from 'next-i18next';
import { errorToast, successToast } from '@components/Toaster';
import { LinkBack } from '@components/LinkBack';
import Loading from '@components/Loading';
import useDirectory from '@lib/ui/hooks/useDirectory';
import { EditDirectory as EditDSync } from '@boxyhq/react-ui/dsync';
import { BOXYHQ_UI_CSS } from '@components/styles';

const EditDirectory = ({ directoryId, setupLinkToken }: { directoryId: string; setupLinkToken?: string }) => {
  const router = useRouter();
  const { t } = useTranslation('common');

  const { directory, isLoading, isValidating, error } = useDirectory(directoryId, setupLinkToken);

  if (isLoading || !directory || isValidating) {
    return <Loading />;
  }

  if (error) {
    errorToast(error.message);
    return null;
  }

  const backUrl = setupLinkToken ? `/setup/${setupLinkToken}/directory-sync` : '/admin/directory-sync';

  const apiUrl = setupLinkToken
    ? `/api/setup/${setupLinkToken}/directory-sync/${directoryId}`
    : `/api/admin/directory-sync/${directoryId}`;
  const redirectUrl = setupLinkToken ? `/setup/${setupLinkToken}/directory-sync` : '/admin/directory-sync';

  return (
    <div>
      <LinkBack href={backUrl} />
      <div className='flex items-center justify-between'>
        <h2 className='mb-5 mt-5 font-bold text-gray-700 md:text-xl'>{t('edit_directory')}</h2>
      </div>
      <div className='rounded border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800'>
        <EditDSync
          displayHeader={false}
          urls={{
            patch: apiUrl,
            delete: apiUrl,
            get: apiUrl,
          }}
          excludeFields={
            setupLinkToken
              ? [
                  'name',
                  'product',
                  'log_webhook_events',
                  'tenant',
                  'google_domain',
                  'type',
                  'webhook_url',
                  'webhook_secret',
                  'scim_endpoint',
                  'scim_token',
                  'google_authorization_url',
                ]
              : undefined
          }
          successCallback={() => {
            successToast(t('directory_updated_successfully'));
            router.replace(redirectUrl);
          }}
          errorCallback={(errMessage) => {
            errorToast(errMessage);
          }}
          hideSave={true}
          classNames={BOXYHQ_UI_CSS}
        />
      </div>
      {/* {!setupLinkToken && (
        <div className='rounded border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800'>
          <form onSubmit={onSubmit}>
            <div className='flex flex-col space-y-3'>
              <div className='form-control w-full'>
                <label className='label'>
                  <span className='label-text'>{t('directory_name')}</span>
                </label>
                <input
                  type='text'
                  id='name'
                  className='input-bordered input w-full'
                  required
                  onChange={onChange}
                  value={directoryUpdated.name}
                />
              </div>
              {directory.type === 'google' && (
                <div className='form-control w-full'>
                  <label className='label'>
                    <span className='label-text'>{t('directory_domain')}</span>
                  </label>
                  <input
                    type='text'
                    id='google_domain'
                    className='input-bordered input w-full'
                    onChange={onChange}
                    value={directoryUpdated.google_domain}
                  />
                </div>
              )}
              <div className='form-control w-full'>
                <label className='label'>
                  <span className='label-text'>{t('webhook_url')}</span>
                </label>
                <input
                  type='text'
                  id='webhook.endpoint'
                  className='input-bordered input w-full'
                  onChange={onChange}
                  value={directoryUpdated.webhook.endpoint}
                />
              </div>
              <div className='form-control w-full'>
                <label className='label'>
                  <span className='label-text'>{t('webhook_secret')}</span>
                </label>
                <input
                  type='text'
                  id='webhook.secret'
                  className='input-bordered input w-full'
                  onChange={onChange}
                  value={directoryUpdated.webhook.secret}
                />
              </div>
              <div className='form-control w-full py-2'>
                <div className='flex items-center'>
                  <input
                    id='log_webhook_events'
                    type='checkbox'
                    checked={directoryUpdated.log_webhook_events}
                    onChange={onChange}
                    className='h-4 w-4 rounded border-gray-300 bg-gray-100 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600'
                  />
                  <label className='ml-2 text-sm font-medium text-gray-900 dark:text-gray-300'>
                    {t('enable_webhook_events_logging')}
                  </label>
                </div>
              </div>
              <div>
                <ButtonPrimary type='submit' loading={loading}>
                  {t('save_changes')}
                </ButtonPrimary>
              </div>
            </div>
          </form>
        </div>
      )}
      <DeleteDirectory directoryId={directoryId} setupLinkToken={setupLinkToken} /> */}
    </div>
  );
};

export default EditDirectory;
