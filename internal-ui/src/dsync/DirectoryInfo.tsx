import { useDirectory } from '../hooks';
import { DirectoryTab } from '../dsync';
import { Loading, Error, PageHeader, Badge } from '../shared';
import { useTranslation } from 'next-i18next';
import { InputWithCopyButton } from '../shared/InputWithCopyButton';
import type { Directory } from '../types';

type ExcludeFields = keyof Pick<Directory, 'tenant' | 'product' | 'webhook'>;

// TODO:
// Add the toast after copying the google auth url

export const DirectoryInfo = ({
  urls,
  excludeFields = [],
}: {
  urls: { getDirectory: string; tabBase: string; googleAuth: string };
  excludeFields?: ExcludeFields[];
}) => {
  const { t } = useTranslation('common');
  const { directory, isLoadingDirectory, directoryError } = useDirectory(urls.getDirectory);

  if (isLoadingDirectory) {
    return <Loading />;
  }

  if (directoryError) {
    return <Error message={directoryError.message} />;
  }

  if (!directory) {
    return null;
  }

  return (
    <>
      <PageHeader title={directory.name} />
      <DirectoryTab activeTab='directory' baseUrl={urls.tabBase} />
      <div className='rounded border'>
        <dl className='divide-y'>
          <div className='px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
            <dt className='text-sm font-medium text-gray-500'>{t('bui-dsync-directory-id')}</dt>
            <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>{directory.id}</dd>
          </div>
          {!excludeFields.includes('tenant') && (
            <div className='px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
              <dt className='text-sm font-medium text-gray-500'>{t('bui-dsync-tenant')}</dt>
              <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>{directory.tenant}</dd>
            </div>
          )}
          {!excludeFields.includes('product') && (
            <div className='px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
              <dt className='text-sm font-medium text-gray-500'>{t('bui-dsync-product')}</dt>
              <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>{directory.product}</dd>
            </div>
          )}
          {!excludeFields.includes('webhook') && (
            <>
              <div className='px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                <dt className='text-sm font-medium text-gray-500'>{t('bui-dsync-webhook-endpoint')}</dt>
                <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>
                  {directory.webhook.endpoint || '-'}
                </dd>
              </div>
              <div className='px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                <dt className='text-sm font-medium text-gray-500'>{t('bui-dsync-webhook-secret')}</dt>
                <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>
                  {directory.webhook.secret || '-'}
                </dd>
              </div>
            </>
          )}
          {directory.type === 'google' && (
            <div className='px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
              <dt className='text-sm font-medium text-gray-500'>{t('bui-dsync-authorized-status')}</dt>
              <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>
                {directory.google_access_token && directory.google_refresh_token ? (
                  <Badge color='success'>{t('bui-dsync-authorized')}</Badge>
                ) : (
                  <Badge color='warning'>{t('bui-dsync-not-authorized')}</Badge>
                )}
              </dd>
            </div>
          )}
        </dl>
      </div>
      {directory.scim.endpoint && directory.scim.secret && (
        <div className='mt-4 space-y-4 rounded border p-6'>
          <div className='form-control'>
            <InputWithCopyButton
              text={directory.scim.endpoint as string}
              label={t('bui-dsync-scim-endpoint')}
            />
          </div>
          <div className='form-control'>
            <InputWithCopyButton text={directory.scim.secret} label={t('bui-dsync-scim-token')} />
          </div>
        </div>
      )}
      {directory.type === 'google' && (
        <div className='form-control mt-6'>
          <InputWithCopyButton
            text={`${urls.googleAuth}?directoryId=${directory.id}`}
            label={t('bui-dsync-google-auth-url')}
          />
        </div>
      )}
    </>
  );
};
