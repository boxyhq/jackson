import { NextPage } from 'next';
import useSWR from 'swr';
import { fetcher } from '@lib/utils';
import Link from 'next/link';
import { PencilAltIcon } from '@heroicons/react/outline';
import { useState } from 'react';

const SAMLConfigurations: NextPage = () => {
  const [paginate, setPaginate] = useState({ offset: 0, limit: 2, page: 0 });
  const { data, error } = useSWR(
    ['/api/admin/saml/config', `?offset=${paginate.offset}&limit=${paginate.limit}`],
    fetcher,
    { revalidateOnFocus: false }
  );
  if (error) {
    return (
      <div className='px-4 py-3 text-red-700 bg-red-100 border border-red-400 rounded'>
        {error.info ? JSON.stringify(error.info) : error.status}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  if (!Array.isArray(data)) {
    return (
      <div>
        <div className='px-4 py-3 text-red-700 bg-red-100 border border-red-400 rounded'>Nothing to show</div>
      </div>
    );
  }

  return (
    <div>
      <div className='flex items-center justify-between'>
        <h2 className='font-bold text-primary dark:text-white md:text-2xl'>SAML Configurations</h2>
        <Link href={'/admin/saml/config/new'}>
          <a className='btn-primary'>
            <span className='inline-block mr-1 md:mr-2' aria-hidden>
              +
            </span>
            New
          </a>
        </Link>
      </div>
      <div className='mt-6 overflow-auto rounded-lg shadow-md'>
        <table className='min-w-full'>
          <thead className='shadow-md bg-gray-50 dark:bg-gray-700 sm:rounded-lg'>
            <tr>
              <th
                scope='col'
                className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase dark:text-gray-400'>
                Tenant
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-700 uppercase dark:text-gray-400'>
                Product
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.map((provider) => (
              <tr key={provider.clientID} className='bg-white border-b dark:border-gray-700 dark:bg-gray-800'>
                <td className='px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap dark:text-white'>
                  {provider.tenant}
                </td>
                <td className='px-6 py-4 text-sm text-gray-500 whitespace-nowrap dark:text-gray-400'>
                  {provider.product}
                </td>
                <td>
                  <Link href={`/admin/saml/config/edit/${provider.clientID}`}>
                    <a className='link-primary'>
                      <PencilAltIcon className='w-5 h-5 text-secondary' />
                    </a>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          type='button'
          className='text-gray-900'
          disabled={paginate.page === 0}
          onClick={() =>
            setPaginate((curState) => ({
              ...curState,
              offset: (curState.page - 1) * paginate.limit,
              page: curState.page - 1,
            }))
          }>
          Previous
        </button>
        &nbsp;&nbsp;&nbsp;&nbsp;
        <button
          type='button'
          className='text-gray-900'
          disabled={data.length === 0 || data.length < paginate.limit}
          onClick={() =>
            setPaginate((curState) => ({
              ...curState,
              offset: (curState.page + 1) * paginate.limit,
              page: curState.page + 1,
            }))
          }>
          Next
        </button>
      </div>
    </div>
  );
};

export default SAMLConfigurations;
