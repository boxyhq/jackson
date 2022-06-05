import { NextPage, GetServerSideProps } from 'next';
import Link from 'next/link';
import jackson from '@lib/jackson';
import { PencilAltIcon } from '@heroicons/react/outline';

const Index: NextPage = (props: any) => {
  const { directories } = props;
    
  return (
    <div>
      <div className='flex items-center justify-between'>
        <h2 className='font-bold text-primary dark:text-white md:text-2xl'>Directory Sync</h2>
        <Link href="/admin/directory-sync/new">
          <a className='btn-primary'>
            + Create New
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
                Name
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-400'>
                Tenant
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-400'>
                Product
              </th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {directories.map((directory) => (
              <tr key={directory.id} className='border-b bg-white dark:border-gray-700 dark:bg-gray-800'>
                <td className='whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white'>
                  {directory.name}
                </td>
                <td className='whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white'>
                  {directory.tenant}
                </td>
                <td className='whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white'>
                  {directory.product}
                </td>
                <td>
                  <Link href={`/admin/directory-sync/${directory.id}/edit`}>
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
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  const { directorySync } = await jackson();

  return {
    props: {
      directories: await directorySync.directories.list()
    },
  }
} 

export default Index;