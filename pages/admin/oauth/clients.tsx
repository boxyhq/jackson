import { NextPage } from 'next';
import useSWR from 'swr';
import { fetcher } from '@lib/utils';
import Link from 'next/link';

const OAuthClient: NextPage = () => {
  const { data, error } = useSWR('/api/admin/providers', fetcher);

  if (error) {
    return (
      <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded'>
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
        <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded'>Nothing to show</div>
      </div>
    );
  }

  return (
    <div>
      <Link href={'/admin/oauth/new'}>
        <a className='bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded leading-6 inline-block'>
          Configure Clients
        </a>
      </Link>
      <table className='border-collapse w-full border-y border-gray-200 dark:border-gray-500 bg-white dark:bg-gray-800 text-sm shadow-sm mt-6'>
        <thead className='bg-gray-50 dark:bg-gray-700'>
          <tr>
            <th className='w-1/2 border-b border-gray-300 dark:border-gray-600 font-semibold p-4 text-gray-900 dark:text-gray-200 text-left'>
              Tenant
            </th>
            <th className='w-1/2 border-b border-gray-300 dark:border-gray-600 font-semibold p-4 text-gray-900 dark:text-gray-200 text-left'>
              Product
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((provider) => (
            <tr key={provider.clientID}>
              <td className='border-b border-gray-100 dark:border-gray-700 p-4 text-gray-500 dark:text-gray-400'>
                {provider.tenant}
              </td>
              <td className='border-b border-gray-100 dark:border-gray-700 p-4 text-gray-500 dark:text-gray-400'>
                {provider.product}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OAuthClient;
