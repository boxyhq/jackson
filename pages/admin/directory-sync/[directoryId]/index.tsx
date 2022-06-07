import type { NextPage, GetServerSideProps } from 'next';
import type { Directory } from '@lib/jackson';
import React from 'react';
import jackson from '@lib/jackson';
import { Input } from '@supabase/ui'
import DirectoryTab from '@components/dsync/DirectoryTab';

const Info: NextPage<{ directory: Directory }> = ({ directory }) => {
  return (
    <div>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='font-bold text-primary dark:text-white md:text-2xl'>{directory.name}</h2>
      </div>
      <DirectoryTab directory={directory} activeTab="directory" />
      <div className="overflow-hidden flex">
        <div className='w-3/4 rounded border'>
          <dl>
            <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-b">
              <dt className="text-sm font-medium text-gray-500">Directory ID</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{directory.id}</dd>
            </div>
            <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-b">
              <dt className="text-sm font-medium text-gray-500">Tenant</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{directory.tenant}</dd>
            </div>
            <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-b">
              <dt className="text-sm font-medium text-gray-500">Product</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{directory.product}</dd>
            </div>
            <div className="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-b bg-gray-100">
              <dt className="text-sm font-medium text-gray-500 pt-2">SCIM Endpoint</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2"><Input value={directory.scim.endpoint} copy readOnly /></dd>
            </div>
            <div className="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-b bg-gray-100">
              <dt className="text-sm font-medium text-gray-500 pt-2">SCIM Token</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2"><Input value={directory.scim.secret} copy reveal readOnly /></dd>
            </div>
            {directory.webhook.endpoint && directory.webhook.secret && (
              <>
                <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-b">
                  <dt className="text-sm font-medium text-gray-500">Webhook Endpoint</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{directory.webhook.endpoint}</dd>
                </div>
                <div className="px-4 py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 pt-2">Webhook Secret</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2"><Input value={directory.webhook.secret} copy reveal readOnly /></dd>
                </div>
              </>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { directoryId } = context.query;
  const { directorySync } = await jackson();

  return {
    props: {
      directory: await directorySync.directories.get(directoryId as string)
    },
  }
}

export default Info;