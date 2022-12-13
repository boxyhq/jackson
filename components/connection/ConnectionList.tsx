import Link from 'next/link';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ClipboardDocumentListIcon,
  LinkIcon,
  PencilIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import EmptyState from '@components/EmptyState';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';

type Connection = {
  name: string;
  tenant: string;
  product: string;
  clientID: string;
  idpMetadata?: any;
  oidcProvider?: any;
};

type ConnectionListProps = {
  setupToken?: string;
  connections: Connection[];
  paginate: any;
  setPaginate: any;
  boxyhqEntityID?: string;
  redirect?: string;
};

const Connections = ({
  paginate,
  setPaginate,
  connections,
  setupToken,
  boxyhqEntityID,
  redirect = 'true',
}: ConnectionListProps) => {
  const { t } = useTranslation('common');
  const router = useRouter();

  const copyUrl = () => {
    if (boxyhqEntityID) {
      navigator.clipboard.writeText(boxyhqEntityID);
    }
  };

  if (!connections) {
    return null;
  }

  if (connections.length === 0 && redirect !== 'false' && setupToken) {
    router.replace(`/setup/${setupToken}/sso-connection/new`);
    return null;
  }
  return (
    <div>
      <div className='mb-5 flex items-center justify-between'>
        <h2 className='font-bold text-gray-700 dark:text-white md:text-xl'>{t('enterprise_sso')}</h2>
        <div>
          <Link
            href={setupToken ? `/setup/${setupToken}/sso-connection/new` : `/admin/sso-connection/new`}
            className='btn-primary btn m-2'
            data-test-id='create-connection'>
            <PlusIcon className='mr-1 h-5 w-5' /> {t('new_connection')}
          </Link>
          {!setupToken && (
            <Link
              href={`/admin/sso-connection/setup-link/new`}
              className='btn-primary btn m-2'
              data-test-id='create-setup-link'>
              <LinkIcon className='mr-1 h-5 w-5' /> {t('new_setup_link')}
            </Link>
          )}
        </div>
      </div>
      {boxyhqEntityID && setupToken && (
        <div className='mb-5 items-center justify-between'>
          <div className='form-control p-2'>
            <div className='input-group'>
              <button className='btn-primary btn h-10 p-2 text-white' onClick={copyUrl}>
                <ClipboardDocumentListIcon className='h-6 w-6' />
              </button>
              <input
                type='text'
                readOnly
                value={boxyhqEntityID}
                className='input-bordered input h-10 w-full'
              />
            </div>
          </div>
        </div>
      )}
      {connections.length === 0 ? (
        <EmptyState
          title={t('no_connections_found')}
          href={setupToken ? `/setup/${setupToken}/sso-connection/new` : `/admin/sso-connection/new`}
        />
      ) : (
        <>
          <div className='rounder border'>
            <table className='w-full text-left text-sm text-gray-500 dark:text-gray-400'>
              <thead className='bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400'>
                <tr>
                  <th scope='col' className='px-6 py-3'>
                    {t('name')}
                  </th>
                  {!setupToken && (
                    <>
                      <th scope='col' className='px-6 py-3'>
                        {t('tenant')}
                      </th>
                      <th scope='col' className='px-6 py-3'>
                        {t('product')}
                      </th>
                    </>
                  )}
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
                  const connectionIsSAML =
                    connection.idpMetadata && typeof connection.idpMetadata === 'object';
                  const connectionIsOIDC =
                    connection.oidcProvider && typeof connection.oidcProvider === 'object';
                  return (
                    <tr
                      key={connection.clientID}
                      className='border-b bg-white last:border-b-0 dark:border-gray-700 dark:bg-gray-800'>
                      <td className='whitespace-nowrap px-6 py-3 text-sm text-gray-500 dark:text-gray-400'>
                        {connection.name || connection.idpMetadata?.provider}
                      </td>
                      {!setupToken && (
                        <>
                          <td className='whitespace-nowrap px-6 py-3 text-sm font-medium text-gray-900 dark:text-white'>
                            {connection.tenant}
                          </td>
                          <td className='whitespace-nowrap px-6 py-3 text-sm text-gray-500 dark:text-gray-400'>
                            {connection.product}
                          </td>
                        </>
                      )}
                      <td className='px-6 py-3'>
                        {connectionIsOIDC ? 'OIDC' : connectionIsSAML ? 'SAML' : ''}
                      </td>
                      <td className='px-6 py-3'>
                        <Link
                          href={
                            setupToken
                              ? `/setup/${setupToken}/sso-connection/edit/${connection.clientID}`
                              : `/admin/sso-connection/edit/${connection.clientID}`
                          }
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

export default Connections;
