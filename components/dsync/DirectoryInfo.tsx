import DirectoryTab from './DirectoryTab';
import { useTranslation } from 'next-i18next';
import { InputWithCopyButton } from '@components/ClipboardButton';
import { LinkBack } from '@components/LinkBack';
import React from 'react';
import useDirectory from '@lib/ui/hooks/useDirectory';
import Loading from '@components/Loading';
import { errorToast } from '@components/Toaster';

const DirectoryInfo = ({ directoryId, setupLinkToken }: { directoryId: string; setupLinkToken?: string }) => {
  const { t } = useTranslation('common');

  const { directory, isLoading, error } = useDirectory(directoryId, setupLinkToken);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    errorToast(error.message);
    return null;
  }

  if (!directory) {
    return null;
  }

  const displayWebhook = directory.webhook.endpoint && directory.webhook.secret;
  const displayTenantProduct = setupLinkToken ? false : true;
  const backUrl = setupLinkToken ? `/setup/${setupLinkToken}/directory-sync` : '/admin/directory-sync';

  return (
    <>
      <LinkBack href={backUrl} />
      <h2 className='mt-5 font-bold text-gray-700 md:text-xl'>{directory.name}</h2>
      <div className='w-full md:w-3/4'>
        <DirectoryTab directory={directory} activeTab='directory' setupLinkToken={setupLinkToken} />
        <div className='my-3 rounded border'>
          <dl className='divide-y'>
            <div className='px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
              <dt className='text-sm font-medium text-gray-500'>{t('directory_id')}</dt>
              <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>{directory.id}</dd>
            </div>
            {displayTenantProduct && (
              <>
                <div className='px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                  <dt className='text-sm font-medium text-gray-500'>{t('tenant')}</dt>
                  <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>{directory.tenant}</dd>
                </div>
                <div className='px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                  <dt className='text-sm font-medium text-gray-500'>{t('product')}</dt>
                  <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>{directory.product}</dd>
                </div>
              </>
            )}
            {displayWebhook && (
              <>
                <div className='px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                  <dt className='text-sm font-medium text-gray-500'>{t('webhook_endpoint')}</dt>
                  <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>
                    {directory.webhook.endpoint}
                  </dd>
                </div>
                <div className='px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                  <dt className='text-sm font-medium text-gray-500'>{t('webhook_secret')}</dt>
                  <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>
                    {directory.webhook.secret}
                  </dd>
                </div>
              </>
            )}
          </dl>
        </div>
        {directory.scim.endpoint && directory.scim.secret && (
          <div className='mt-4 space-y-4 rounded border p-6'>
            <div className='form-control'>
              <InputWithCopyButton text={directory.scim.endpoint as string} label={t('scim_endpoint')} />
            </div>
            <div className='form-control'>
              <InputWithCopyButton text={directory.scim.secret} label={t('scim_token')} />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DirectoryInfo;
