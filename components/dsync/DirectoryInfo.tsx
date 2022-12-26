import { Directory } from '@lib/jackson';
import DirectoryTab from './DirectoryTab';
import { useTranslation } from 'next-i18next';
import { InputWithCopyButton } from '@components/InputWithCopyButton';
type DirectoryInfoProps = {
  directory: Directory;
  token?: string;
};

const DirectoryInfo = ({ directory, token }: DirectoryInfoProps) => {
  const { t } = useTranslation('common');
  return (
    <>
      <h2 className='font-bold text-gray-700 md:text-xl'>{directory.name}</h2>
      <div className='w-full md:w-3/4'>
        <DirectoryTab directory={directory} activeTab='directory' token={token} />
        <div className='my-3 rounded border'>
          <dl>
            <div className='border-b px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
              <dt className='text-sm font-medium text-gray-500'>Directory ID</dt>
              <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>{directory.id}</dd>
            </div>
            {!token && (
              <>
                <div className='border-b px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                  <dt className='text-sm font-medium text-gray-500'>Tenant</dt>
                  <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>{directory.tenant}</dd>
                </div>
                <div className='border-b px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                  <dt className='text-sm font-medium text-gray-500'>Product</dt>
                  <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>{directory.product}</dd>
                </div>
              </>
            )}
            {directory.webhook.endpoint && directory.webhook.secret && (
              <>
                <div className='border-b px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                  <dt className='text-sm font-medium text-gray-500'>Webhook Endpoint</dt>
                  <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>
                    {directory.webhook.endpoint}
                  </dd>
                </div>
                <div className='border-b px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                  <dt className='text-sm font-medium text-gray-500'>Webhook Secret</dt>
                  <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>
                    {directory.webhook.secret}
                  </dd>
                </div>
              </>
            )}
            <div className='flex items-center border-b px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
              <dt className='text-sm font-medium text-gray-500'>SCIM Endpoint</dt>
              <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>
                <InputWithCopyButton value={directory.scim.endpoint as string} />
              </dd>
            </div>
            <div className='flex items-center px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
              <dt className='text-sm font-medium text-gray-500'>SCIM Token</dt>
              <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>
                <InputWithCopyButton value={directory.scim.secret} />
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </>
  );
};

export default DirectoryInfo;
