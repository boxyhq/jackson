import { Directory } from '@lib/jackson';
import DirectoryTab from './DirectoryTab';
import { useTranslation } from 'next-i18next';
import { InputWithCopyButton } from '@components/ClipboardButton';
import { LinkBack } from '@components/LinkBack';

type DirectoryInfoProps = {
  directory: Directory;
  token?: string;
};

const DirectoryInfo = ({ directory, token }: DirectoryInfoProps) => {
  const { t } = useTranslation('common');

  const displayWebhook = directory.webhook.endpoint && directory.webhook.secret;
  const displayTenantProduct = token ? false : true;
  const backUrl = token ? `/setup/${token}/directory-sync` : '/admin/directory-sync';

  return (
    <>
      <LinkBack href={backUrl} />
      <h2 className='mt-5 font-bold text-gray-700 md:text-xl'>{directory.name}</h2>
      <div className='w-full md:w-3/4'>
        <DirectoryTab directory={directory} activeTab='directory' token={token} />
        <div className='my-3 rounded border'>
          <dl>
            <div className='border-b px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
              <dt className='text-sm font-medium text-gray-500'>{t('directory_id')}</dt>
              <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>{directory.id}</dd>
            </div>
            {displayTenantProduct && (
              <>
                <div className='border-b px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                  <dt className='text-sm font-medium text-gray-500'>{t('tenant')}</dt>
                  <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>{directory.tenant}</dd>
                </div>
                <div className='border-b px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                  <dt className='text-sm font-medium text-gray-500'>{t('product')}</dt>
                  <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>{directory.product}</dd>
                </div>
              </>
            )}
            {displayWebhook && (
              <>
                <div className='border-b px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
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
        <div className='mt-4 space-y-4 rounded border p-6'>
          <div className='form-control'>
            <InputWithCopyButton text={directory.scim.endpoint as string} label={t('scim_endpoint')} />
          </div>
          <div className='form-control'>
            <InputWithCopyButton text={directory.scim.secret} label={t('scim_token')} />
          </div>
        </div>
      </div>
    </>
  );
};

export default DirectoryInfo;
