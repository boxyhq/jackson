import type { NextPage } from 'next';
import useSWR from 'swr';
import Link from 'next/link';
import { ArrowSmLeftIcon, ArrowSmRightIcon, PencilAltIcon } from '@heroicons/react/outline';
import { useState } from 'react';

import { fetcher } from '@lib/ui/utils';

type SAMLConfig = {
  name: string;
  tenant: string;
  product: string;
  clientID: string;
};

const SAMLConfigurations: NextPage = () => {
  const [paginate, setPaginate] = useState({ pageOffset: 0, pageLimit: 20, page: 0 });

  const { data: samlConfigs } = useSWR<SAMLConfig[]>(
    ['/api/admin/saml/config', `?pageOffset=${paginate.pageOffset}&pageLimit=${paginate.pageLimit}`],
    fetcher,
    { revalidateOnFocus: false }
  );

  if (!samlConfigs) {
    return <></>;
  }

  return (
    <div>
      <div className='mb-5 flex items-center justify-between'>
        <h2 className='font-bold text-gray-700 dark:text-white md:text-xl'>SAML Connections</h2>
        <Link href={'/admin/saml/config/new'}>
          <a className='btn btn-primary'>Create SAML Connection</a>
        </Link>
      </div>
      <div className='rounder border'>
        <table className='w-full text-left text-sm text-gray-500 dark:text-gray-400'>
          <thead className='bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400'>
            <tr>
              <th scope='col' className='px-6 py-3'>
                Name
              </th>
              <th scope='col' className='px-6 py-3'>
                Tenant
              </th>
              <th scope='col' className='px-6 py-3'>
                Product
              </th>
              <th scope='col' className='px-6 py-3'>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {samlConfigs.map((samlConfig) => (
              <tr
                key={samlConfig.clientID}
                className='border-b bg-white dark:border-gray-700 dark:bg-gray-800'>
                <td className='whitespace-nowrap px-6 py-3 text-sm font-medium text-gray-900 dark:text-white'>
                  {samlConfig.name}
                </td>
                <td className='whitespace-nowrap px-6 py-3 text-sm font-medium text-gray-900 dark:text-white'>
                  {samlConfig.tenant}
                </td>
                <td className='whitespace-nowrap px-6 py-3 text-sm text-gray-500 dark:text-gray-400'>
                  {samlConfig.product}
                </td>
                <td className='px-6 py-3'>
                  <Link href={`/admin/saml/config/edit/${samlConfig.clientID}`}>
                    <a className='link-primary'>
                      <PencilAltIcon className='h-5 w-5 text-secondary' />
                    </a>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className='mt-4 flex justify-center'>
        <button
          type='button'
          className='btn btn-outline'
          disabled={paginate.page === 0}
          aria-label='Previous'
          onClick={() =>
            setPaginate((curState) => ({
              ...curState,
              pageOffset: (curState.page - 1) * paginate.pageLimit,
              page: curState.page - 1,
            }))
          }>
          <ArrowSmLeftIcon className='mr-1 h-5 w-5' aria-hidden />
          Prev
        </button>
        &nbsp;&nbsp;&nbsp;&nbsp;
        <button
          type='button'
          className='btn btn-outline'
          disabled={samlConfigs.length === 0 || samlConfigs.length < paginate.pageLimit}
          onClick={() =>
            setPaginate((curState) => ({
              ...curState,
              pageOffset: (curState.page + 1) * paginate.pageLimit,
              page: curState.page + 1,
            }))
          }>
          <ArrowSmRightIcon className='mr-1 h-5 w-5' aria-hidden />
          Next
        </button>
      </div>
    </div>
  );
};

export default SAMLConfigurations;
