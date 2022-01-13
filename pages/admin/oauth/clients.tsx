import { NextPage } from 'next';
import useSWR from 'swr';
import { fetcher } from '@lib/utils';

const OAuthClient: NextPage = () => {
  const { data, error } = useSWR('/api/admin/providers', fetcher);

  if (error) {
    return (
      <div className='p-6'>
        <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded'>
          {JSON.stringify(error.info)}
        </div>
      </div>
    );
  }

  if (!Array.isArray(data)) {
    return (
      <div className='p-6'>
        <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded'>Nothing to show</div>
      </div>
    );
  }

  return (
    <div className='p-6'>
      <table className='border-collapse w-full border-y border-gray-200 dark:border-gray-500 bg-white dark:bg-gray-800 text-sm shadow-sm'>
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
