import type { NextPage } from 'next';
import type { SAMLFederationApp } from '@boxyhq/saml-jackson';
import useSWR from 'swr';
import Link from 'next/link';

import type { ApiError, ApiSuccess } from 'types';
import { fetcher } from '@lib/ui/utils';
import Loading from '@components/Loading';
import EmptyState from '@components/EmptyState';
import Alert from '@components/Alert';
import LicenseRequired from '@components/LicenseRequired';

const AppsList: NextPage = () => {
  const { data, error } = useSWR<ApiSuccess<SAMLFederationApp[]>, ApiError>(
    '/api/admin/federated-saml',
    fetcher
  );

  if (!data) {
    return <Loading />;
  }

  if (error) {
    return <Alert type='error' message={error.message}></Alert>;
  }

  const apps = data.data;
  const noApps = apps && apps.length === 0;

  return (
    <LicenseRequired>
      <div className='mb-5 flex items-center justify-between'>
        <h2 className='font-bold text-gray-700 dark:text-white md:text-xl'>SAML Federation Apps</h2>
        <Link href={'/admin/federated-saml/new'} className='btn-primary btn'>
          + Create New
        </Link>
      </div>
      {noApps ? (
        <>
          <EmptyState
            title='No SAML federation apps found'
            description='SAML Federation allows you to connect your application with other SAML enabled application like
            Twilio Flex.'
            href='/admin/federated-saml/new'
          />
        </>
      ) : (
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
                  Metadata
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
                      <td className='px-6 py-3'>
                        <Link
                          href={`/admin/federated-saml/${app.id}/edit`}
                          className='link-primary link underline-offset-4'>
                          {app.name}
                        </Link>
                      </td>
                      <td className='px-6 py-3'>{app.tenant}</td>
                      <td className='px-6'>{app.product}</td>
                      <td className='px-6'>
                        <Link
                          href={`/admin/federated-saml/${app.id}/metadata`}
                          className='link-secondary link underline-offset-4'>
                          Download
                        </Link>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </LicenseRequired>
  );
};

export default AppsList;
