import EmptyState from '@components/EmptyState';
import Paginate from '@components/Paginate';
import { CircleStackIcon, LinkIcon, PencilIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Directory } from '@lib/jackson';
import Link from 'next/link';

type DirectoryListProps = {
  directories: Directory[];
  pageOffset: number;
  pageLimit: number;
  providers: any;
  token?: string;
};

const DirectoryList = ({ directories, pageOffset, pageLimit, providers, token }: DirectoryListProps) => {
  return (
    <>
      <div className='mb-5 flex items-center justify-between'>
        <h2 className='font-bold text-gray-700 dark:text-white md:text-xl'>Directory Sync</h2>
        <div>
          <Link
            href={token ? `/setup/${token}/directory-sync/new` : '/admin/directory-sync/new'}
            className='btn-primary btn'>
            <PlusIcon className='mr-1 h-5 w-5' /> New Directory
          </Link>
          {!token && (
            <Link
              href={`/admin/setup-link/new?service=dsync`}
              className='btn-primary btn m-2'
              data-test-id='create-setup-link'>
              <LinkIcon className='mr-1 h-5 w-5' /> New Setup Link
            </Link>
          )}
        </div>
      </div>
      {directories?.length === 0 && pageOffset === 0 ? (
        <EmptyState
          title='No directories found'
          href={token ? `/setup/${token}/directory-sync/new` : '/admin/directory-sync/new'}
        />
      ) : (
        <div className='rounder border'>
          <table className='w-full text-left text-sm text-gray-500 dark:text-gray-400'>
            <thead className='bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400'>
              <tr>
                <th scope='col' className='px-6 py-3'>
                  Name
                </th>
                {!token && (
                  <>
                    <th scope='col' className='px-6 py-3'>
                      Tenant
                    </th>
                    <th scope='col' className='px-6 py-3'>
                      Product
                    </th>
                  </>
                )}
                <th scope='col' className='px-6 py-3'>
                  Type
                </th>
                <th scope='col' className='px-6 py-3'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {directories &&
                directories.map((directory) => {
                  return (
                    <tr
                      key={directory.id}
                      className='border-b bg-white last:border-b-0 dark:border-gray-700 dark:bg-gray-800'>
                      <td className='whitespace-nowrap px-6 py-3 text-sm text-gray-500 dark:text-gray-400'>
                        {directory.name}
                      </td>
                      {!token && (
                        <>
                          <td className='px-6'>{directory.tenant}</td>
                          <td className='px-6'>{directory.product}</td>
                        </>
                      )}
                      <td className='px-6'>{providers[directory.type]}</td>
                      <td className='px-6'>
                        <div className='flex flex-row'>
                          <Link
                            href={
                              token
                                ? `/setup/${token}/directory-sync/${directory.id}`
                                : `/admin/directory-sync/${directory.id}`
                            }
                            className='link-primary'>
                            <CircleStackIcon className='h-5 w-5 text-secondary' />
                          </Link>
                          <Link
                            href={
                              token
                                ? `/setup/${token}/directory-sync/${directory.id}/edit`
                                : `/admin/directory-sync/${directory.id}/edit`
                            }
                            className='link-primary'>
                            <PencilIcon className='h-5 w-5 text-secondary' />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          <Paginate
            pageOffset={pageOffset}
            pageLimit={pageLimit}
            itemsCount={directories ? directories.length : 0}
            path={token ? `/setup/${token}/directory-sync?` : `/admin/directory-sync?`}
          />
        </div>
      )}
    </>
  );
};

export default DirectoryList;
