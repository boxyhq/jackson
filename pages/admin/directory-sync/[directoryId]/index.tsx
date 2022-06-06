import { NextPage, GetServerSideProps } from 'next';
import React from 'react';
import jackson from '@lib/jackson';
import { Input } from '@supabase/ui'
import DirectoryTab from '@components/dsync/DirectoryTab';

const Info: NextPage = (props: any) => {
  const { directory } = props;

  return (
    <div>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='font-bold text-primary dark:text-white md:text-2xl'>{directory.name}</h2>
      </div>
      <DirectoryTab directory={directory} activeTab="directory" />
      <div className="relative overflow-x-auto rounded border">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <tbody>
            <DetailsRow label="Tenant" value={directory.tenant} />
            <DetailsRow label="Product" value={directory.product} />
            <DetailsRow label="SCIM Endpoint" value={<Input value={directory.scim.endpoint} copy readOnly />} type="input" />
            <DetailsRow label="SCIM Token" value={<Input value={directory.scim.secret} copy reveal readOnly />} type="input" />
            <DetailsRow label="Webhook Endpoint" value={directory.webhook.endpoint} />
            <DetailsRow label="Webhook Secret" value={directory.webhook.secret ? <Input value={directory.webhook.secret} copy reveal readOnly /> : ''} type="input" lastRaw={true} />
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DetailsRow = (props: any) => {
  const { label, value, type = "string", lastRaw = false } = props;

  const border = !lastRaw ? 'border-b' : '';
  const padding = (type === 'input') ? 'py-2' : 'py-4';

  return (
    <tr className={`${border} bg-white dark:bg-gray-800 dark:border-gray-700`}>
      <th scope="row" className={`${padding} px-6 font-medium text-gray-900 dark:text-white whitespace-nowrap`}>
        {label}
      </th>
      <td className={`${padding} px-6`}>
        {value}
      </td>
    </tr>
  );
}

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