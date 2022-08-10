import type { NextPage } from 'next';
import useSWR from 'swr';
import Link from 'next/link';
import { ArrowSmLeftIcon, ArrowSmRightIcon, PencilAltIcon } from '@heroicons/react/outline';
import { useState } from 'react';

import { fetcher } from '@lib/ui/utils';
import EmptyState from '@components/EmptyState';
import { useRouter } from 'next/router';

type Connection = {
  name: string;
  tenant: string;
  product: string;
  clientID: string;
};

const Connections: NextPage = () => {
  const router = useRouter();
  const { strategy } = router.query;
  const strategyTitle = strategy === 'saml' ? 'SAML' : 'OIDC';
  const [paginate, setPaginate] = useState({ pageOffset: 0, pageLimit: 20, page: 0 });

  const { data: connections } = useSWR<Connection[]>(
    strategy
      ? [
          `/api/admin/${strategy}/connection`,
          `?pageOffset=${paginate.pageOffset}&pageLimit=${paginate.pageLimit}`,
        ]
      : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  if (!connections) {
    return null;
  }

  return (
    <div>
      <div className='mb-5 flex items-center justify-between'>
        <h2 className='font-bold text-gray-700 dark:text-white md:text-xl'>{strategyTitle} Connections</h2>
        <Link href={`/admin/${strategy}/connection/new`}>
          <a className='btn btn-primary' data-test-id='create-saml-connection'>
            + New Connection
          </a>
        </Link>
      </div>
      {connections.length === 0 ? (
        <EmptyState
          title={`No ${strategyTitle} connections found.`}
          href={`/admin/${strategy}/connection/new`}
        />
      ) : (
        <>
          <div className='rounder border'>
            <table className='w-full text-left text-sm text-gray-500 dark:text-gray-400'>
              <thead className='bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400'>
                <tr>
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
                {connections.map((connection) => (
                  <tr
                    key={connection.clientID}
                    className='border-b bg-white dark:border-gray-700 dark:bg-gray-800'>
                    <td className='whitespace-nowrap px-6 py-3 text-sm font-medium text-gray-900 dark:text-white'>
                      {connection.tenant}
                    </td>
                    <td className='whitespace-nowrap px-6 py-3 text-sm text-gray-500 dark:text-gray-400'>
                      {connection.product}
                    </td>
                    <td className='px-6 py-3'>
                      <Link href={`/admin/${strategy}/connection/edit/${connection.clientID}`}>
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
              disabled={connections.length === 0 || connections.length < paginate.pageLimit}
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
        </>
      )}
    </div>
  );
};

export default Connections;
