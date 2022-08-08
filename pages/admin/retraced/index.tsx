import { NextPage } from 'next';
import useSWR from 'swr';
import { fetcher } from '@lib/ui/utils';
import Link from 'next/link';
import { ArrowSmLeftIcon, ArrowSmRightIcon, ViewListIcon, InformationCircleIcon } from '@heroicons/react/outline';
import { useState } from 'react';

const RetracedProjects: NextPage = () => {
  const [paginate, setPaginate] = useState({ pageOffset: 0, pageLimit: 20, page: 0 });
  const { data, error } = useSWR(['/api/retraced/projects'], fetcher, { revalidateOnFocus: false });
  if (error) {
    return (
      <div className='rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700'>
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
        <div className='rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700'>Nothing to show</div>
      </div>
    );
  }

  return (
    <div>
      <div className='flex items-center justify-between'>
        <h2 className='font-bold text-primary dark:text-white md:text-2xl'>Audit Logs</h2>
        <Link href={'/admin/retraced/new'}>
          <a className='btn-primary'>
            <span className='mr-1 inline-block md:mr-2' aria-hidden>
              +
            </span>
            New
          </a>
        </Link>
      </div>
      <div className='mt-6 overflow-auto rounded-lg shadow-md'>
        <table className='min-w-full'>
          <thead className='bg-gray-50 shadow-md dark:bg-gray-700 sm:rounded-lg'>
            <tr>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-400'>
                Product
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-400'>
                Environment
              </th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.map((tenant) => (
              <tr
                key={tenant.projectId + tenant.environmentName}
                className='border-b bg-white dark:border-gray-700 dark:bg-gray-800'>
                <td className='whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white'>
                  {tenant.name}
                </td>
                <td className='whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400'>
                  {tenant.environmentName}
                </td>
                <td>
                  <Link
                    href={`/admin/retraced/log-viewer/${tenant.name}-${tenant.token}-${tenant.projectId}-${tenant.environmentId}`}>
                    <a className='link-primary'>
                      <ViewListIcon className='h-5 w-5 text-secondary' />
                    </a>
                  </Link>
                </td>
                <td>
                  <Link
                    href={`/admin/retraced/info/${tenant.projectId}`}>
                    <a className='link-primary'>
                      <InformationCircleIcon className='h-5 w-5 text-secondary' />
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
          className='btn-secondary hover:not(:disabled):scale-105 inline-flex min-w-[6rem] items-center justify-center py-1'
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
          className='btn-secondary hover:not(:disabled):scale-105 inline-flex min-w-[6rem] items-center justify-center py-1'
          disabled={data.length === 0 || data.length < paginate.pageLimit}
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

export default RetracedProjects;
