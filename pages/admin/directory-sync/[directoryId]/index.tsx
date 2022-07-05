import type { NextPage, GetServerSidePropsContext } from 'next';
import React from 'react';
import jackson from '@lib/jackson';
import { Input } from '@supabase/ui';
import DirectoryTab from '@components/dsync/DirectoryTab';
import { inferSSRProps } from '@lib/inferSSRProps';

const Info: NextPage<inferSSRProps<typeof getServerSideProps>> = ({ directory }) => {
  return (
    <div>
      <div className='mb-4 flex items-center justify-between'>
        <h2 className='font-bold text-primary dark:text-white md:text-2xl'>{directory.name}</h2>
      </div>
      <DirectoryTab directory={directory} activeTab='directory' />
      <div className='flex overflow-hidden'>
        <div className='w-3/4 rounded border'>
          <dl>
            <div className='border-b px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
              <dt className='text-sm font-medium text-gray-500'>Directory ID</dt>
              <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>{directory.id}</dd>
            </div>
            <div className='border-b px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
              <dt className='text-sm font-medium text-gray-500'>Tenant</dt>
              <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>{directory.tenant}</dd>
            </div>
            <div className='border-b px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
              <dt className='text-sm font-medium text-gray-500'>Product</dt>
              <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>{directory.product}</dd>
            </div>
            <div className='border-b bg-gray-100 px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
              <dt className='pt-2 text-sm font-medium text-gray-500'>SCIM Endpoint</dt>
              <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>
                <Input value={directory.scim.endpoint} copy readOnly />
              </dd>
            </div>
            <div className='border-b bg-gray-100 px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
              <dt className='pt-2 text-sm font-medium text-gray-500'>SCIM Token</dt>
              <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>
                <Input value={directory.scim.secret} copy reveal readOnly />
              </dd>
            </div>
            {directory.webhook.endpoint && directory.webhook.secret && (
              <>
                <div className='border-b px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                  <dt className='text-sm font-medium text-gray-500'>Webhook Endpoint</dt>
                  <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>
                    {directory.webhook.endpoint}
                  </dd>
                </div>
                <div className='px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                  <dt className='pt-2 text-sm font-medium text-gray-500'>Webhook Secret</dt>
                  <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>
                    <Input value={directory.webhook.secret} copy reveal readOnly />
                  </dd>
                </div>
              </>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const { directoryId } = context.query;
  const { directorySyncController } = await jackson();

  const { data: directory } = await directorySyncController.directories.get(directoryId as string);

  if (!directory) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      directory,
    },
  };
};

export default Info;
