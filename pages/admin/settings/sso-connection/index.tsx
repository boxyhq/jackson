import type { GetServerSidePropsContext, NextPage } from 'next';
import useSWR from 'swr';
import Link from 'next/link';
import { ArrowLeftIcon, ArrowRightIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { fetcher } from '@lib/ui/utils';
import EmptyState from '@components/EmptyState';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Loading from '@components/Loading';
import { errorToast } from '@components/Toaster';
import type { OIDCSSORecord, SAMLSSORecord } from '@boxyhq/saml-jackson';
import type { ApiSuccess, ApiError } from 'types';

const ConnectionsIndexPageForSettings: NextPage = () => {
  const { t } = useTranslation('common');
  const [paginate, setPaginate] = useState({ pageOffset: 0, pageLimit: 20, page: 0 });

  const { data, isLoading, error } = useSWR<ApiSuccess<(SAMLSSORecord | OIDCSSORecord)[]>, ApiError>(
    `/api/admin/settings/sso`,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    errorToast(error.message);
    return null;
  }

  const connections = data?.data || [];

  return (
    <div>
      <div className='mb-5 flex items-center justify-between'>
        <h2 className='font-bold text-gray-700 dark:text-white md:text-xl'>{t('admin_portal_sso')}</h2>
        <Link
          href={`/admin/settings/sso-connection/new`}
          className='btn-primary btn'
          data-test-id='create-connection'>
          + {t('new_connection')}
        </Link>
      </div>
      {connections.length === 0 ? (
        <EmptyState title={t('no_connections_found')} href={`/admin/settings/sso-connection/new`} />
      ) : (
        <>
          <div className='rounder border'>
            <table className='w-full text-left text-sm text-gray-500 dark:text-gray-400'>
              <thead className='bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400'>
                <tr>
                  <th scope='col' className='px-6 py-3'>
                    {t('tenant')}
                  </th>
                  <th scope='col' className='px-6 py-3'>
                    {t('product')}
                  </th>
                  <th scope='col' className='px-6 py-3'>
                    {t('idp_type')}
                  </th>
                  <th scope='col' className='px-6 py-3'>
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {connections.map((connection) => {
                  const connectionIsSAML = 'idpMetadata' in connection;
                  const connectionIsOIDC = 'oidcProvider' in connection;
                  return (
                    <tr
                      key={connection.clientID}
                      className='border-b bg-white last:border-b-0 dark:border-gray-700 dark:bg-gray-800'>
                      <td className='whitespace-nowrap px-6 py-3 text-sm font-medium text-gray-900 dark:text-white'>
                        {connection.tenant}
                      </td>
                      <td className='whitespace-nowrap px-6 py-3 text-sm text-gray-500 dark:text-gray-400'>
                        {connection.product}
                      </td>
                      <td className='px-6 py-3'>
                        {connectionIsOIDC ? 'OIDC' : connectionIsSAML ? 'SAML' : ''}
                      </td>
                      <td className='px-6 py-3'>
                        <Link
                          href={`/admin/settings/sso-connection/edit/${connection.clientID}`}
                          className='link-primary'>
                          <PencilIcon className='h-5 w-5 text-secondary' />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className='mt-4 flex justify-center'>
            <button
              type='button'
              className='btn-outline btn'
              disabled={paginate.page === 0}
              aria-label={t('previous')}
              onClick={() =>
                setPaginate((curState) => ({
                  ...curState,
                  pageOffset: (curState.page - 1) * paginate.pageLimit,
                  page: curState.page - 1,
                }))
              }>
              <ArrowLeftIcon className='mr-1 h-5 w-5' aria-hidden />
              {t('prev')}
            </button>
            &nbsp;&nbsp;&nbsp;&nbsp;
            <button
              type='button'
              className='btn-outline btn'
              disabled={connections.length === 0 || connections.length < paginate.pageLimit}
              onClick={() =>
                setPaginate((curState) => ({
                  ...curState,
                  pageOffset: (curState.page + 1) * paginate.pageLimit,
                  page: curState.page + 1,
                }))
              }>
              <ArrowRightIcon className='mr-1 h-5 w-5' aria-hidden />
              {t('next')}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ConnectionsIndexPageForSettings;

export async function getStaticProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}
