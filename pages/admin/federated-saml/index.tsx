import type { NextPage } from 'next';
import type { SAMLFederationApp } from '@boxyhq/saml-jackson';
import useSWR from 'swr';
import Link from 'next/link';
import { PencilSquareIcon } from '@heroicons/react/24/outline';

import { extractMessageFromError } from '@lib/utils';
import { fetcher } from '@lib/ui/utils';
import Loading from '@components/Loading';
import EmptyState from '@components/EmptyState';
import Alert from '@components/Alert';

const AppsList: NextPage = () => {
  const { data, error } = useSWR<{ data: SAMLFederationApp[] }>('/api/admin/saml-federation', fetcher);

  if (!data && !error) {
    return <Loading />;
  }

  if (error) {
    return <Alert type='error' message={extractMessageFromError(error)}></Alert>;
  }

  const apps = data?.data;
  const noApps = apps && apps.length === 0;

  return (
    <>
      {error && <Alert message={error.message} type='error' />}
      <div className='mb-5 flex items-center justify-between'>
        <h2 className='font-bold text-gray-700 dark:text-white md:text-xl'>SAML Federation Apps</h2>
        <Link href={'/admin/saml-federation/new'} className='btn-primary btn'>
          + Create New
        </Link>
      </div>
      {noApps ? (
        <>
          <EmptyState
            title='No SAML federation apps found'
            description='SAML Federation allows you to connect your application with other SAML enabled application like
            Twilio Flex.'
            href='/admin/saml-federation/new'
          />
        </>
      ) : (
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
              {apps &&
                apps.map((app) => {
                  return (
                    <tr
                      key={app.id}
                      className='border-b bg-white last:border-b-0 dark:border-gray-700 dark:bg-gray-800'>
                      <td className='px-6 py-3'>{app.tenant}</td>
                      <td className='px-6'>{app.product}</td>
                      <td className='px-6'>
                        <div className='flex items-center gap-2'>
                          <Link href={`/admin/saml-federation/${app.id}`} className='btn-link'>
                            <div className='tooltip' data-tip='Edit app'>
                              <PencilSquareIcon className='h-5 w-5' />
                            </div>
                          </Link>
                          <Link href={`/admin/saml-federation/${app.id}/metadata`} className='btn-link'>
                            <div className='tooltip' data-tip='Metadata URL'>
                              Metadata
                            </div>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default AppsList;
