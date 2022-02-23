import { NextPage } from 'next';
import useSWR from 'swr';
import { fetcher } from '@lib/utils';
import Link from 'next/link';
import { PencilAltIcon } from '@heroicons/react/outline';

const SAMLConfigurations: NextPage = () => {
  const { data, error } = useSWR('/api/admin/saml/config', fetcher, { revalidateOnFocus: false });

  if (error) {
    return (
      <div className='rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700'>
        {error.info ? JSON.stringify(error.info) : error.status}
      </div>
    );
  }

  if (!data) {
    return <div>Loading...</div>;
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
        <h2 className='font-bold text-primary dark:text-white md:text-2xl'>SAML Configurations</h2>
        <Link href={'/admin/saml/config/new'}>
          <a className='btn-primary'>
            <span className='mr-1 inline-block md:mr-2' aria-hidden>
              +
            </span>
            Add Configuration
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
            {data.map((provider) => (
              <tr key={provider.clientID} className='border-b bg-white dark:border-gray-700 dark:bg-gray-800'>
                <td className='whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white'>
                  {provider.tenant}
                </td>
                <td className='whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400'>
                  {provider.product}
                </td>
                <td>
                  <Link href={`/admin/saml/config/edit/${provider.clientID}`}>
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

export default SAMLConfigurations;
