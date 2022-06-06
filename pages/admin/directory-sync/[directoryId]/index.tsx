import { NextPage, GetServerSideProps } from 'next';
import React from 'react';
import jackson from '@lib/jackson';
import { Input } from '@supabase/ui'

const Info: NextPage = (props: any) => {
  const { directory } = props;

  return (
    <div>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='font-bold text-primary dark:text-white md:text-2xl'>{directory.name}</h2>
      </div>
      <div className="flex flex-col space-y-3">
        <div className="grid grid-cols-6 gap-4">
          <span>Tenant</span>
          <span>{directory.tenant}</span>
        </div>
        <div className="grid grid-cols-6 gap-4">
          <span>Product</span>
          <span>{directory.product}</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <span>SCIM Endpoint</span>
          <Input value={directory.scim.endpoint} copy readOnly />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <span>SCIM Bearer Token</span>
          <Input value={directory.scim.secret} copy reveal readOnly />
        </div>
          <div>
            <div className="grid grid-cols-6 gap-4">
              <span>Webhook Endpoint</span>
              <span>{directory.webhook.endpoint}</span>
            </div>
            <div className="grid grid-cols-6 gap-4">
              <span>Webhook Secret</span>
              <Input value={directory.webhook.secret} copy reveal readOnly />
            </div>
          </div>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { directoryId } = context.query;
  const { directorySync } = await jackson();

  const directory = await directorySync.directories.get(directoryId as string);

  return {
    props: {
      directory,
    },
  }
}

export default Info;