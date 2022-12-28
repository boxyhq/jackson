import { LinkIcon, PencilIcon, PlusIcon } from '@heroicons/react/24/outline';
import EmptyState from '@components/EmptyState';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { LinkPrimary } from '@components/LinkPrimary';
import { IconButton } from '@components/IconButton';
import { InputWithCopyButton } from '@components/ClipboardButton';
import { Pagination, pageLimit } from '@components/Pagination';
import type { OIDCSSORecord, SAMLSSORecord } from '@boxyhq/saml-jackson';

type ConnectionListProps = {
  connections: (SAMLSSORecord | OIDCSSORecord)[];
  setupToken?: string;
  idpEntityID?: string;
  paginate: {
    offset: number;
  };
  setPaginate: (paginate: { offset: number }) => void;
};

const ConnectionList = ({
  paginate,
  setPaginate,
  connections,
  setupToken,
  idpEntityID,
}: ConnectionListProps) => {
  const { t } = useTranslation('common');
  const router = useRouter();

  if (!connections) {
    return null;
  }

  if (connections.length === 0 && setupToken) {
    router.replace(`/setup/${setupToken}/sso-connection/new`);
    return null;
  }

  const displayTenantProduct = setupToken ? false : true;

  return (
    <div>
      <div className='mb-5 flex items-center justify-between'>
        <h2 className='font-bold text-gray-700 dark:text-white md:text-xl'>{t('enterprise_sso')}</h2>
        <div className='flex gap-2'>
          <LinkPrimary
            Icon={PlusIcon}
            href={setupToken ? `/setup/${setupToken}/sso-connection/new` : `/admin/sso-connection/new`}
            data-test-id='create-connection'>
            {t('new_connection')}
          </LinkPrimary>
          {!setupToken && (
            <LinkPrimary
              Icon={LinkIcon}
              href='/admin/sso-connection/setup-link/new'
              data-test-id='create-setup-link'>
              {t('new_setup_link')}
            </LinkPrimary>
          )}
        </div>
      </div>
      {idpEntityID && setupToken && (
        <div className='mb-5 mt-5 items-center justify-between'>
          <div className='form-control'>
            <InputWithCopyButton text={idpEntityID} label={t('idp_entity_id')} />
          </div>
        </div>
      )}
      {connections.length === 0 && paginate.offset === 0 ? (
        <EmptyState
          title={t('no_connections_found')}
          href={setupToken ? `/setup/${setupToken}/sso-connection/new` : `/admin/sso-connection/new`}
        />
      ) : (
        <>
          <div className='rounder border'>
            <table className='w-full text-left text-sm text-gray-500 dark:text-gray-400'>
              <thead className='bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400'>
                <tr className='hover:bg-gray-50'>
                  <th scope='col' className='px-6 py-3'>
                    {t('name')}
                  </th>
                  {displayTenantProduct && (
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
                  const connectionIsSAML = 'idpMetadata' in connection;
                  const connectionIsOIDC = 'oidcProvider' in connection;

                  return (
                    <tr
                      key={connection.clientID}
                      className='border-b bg-white last:border-b-0 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800'>
                      <td className='whitespace-nowrap px-6 py-3 text-sm text-gray-500 dark:text-gray-400'>
                        {connection.name ||
                          (connectionIsSAML
                            ? connection.idpMetadata?.provider
                            : connection.oidcProvider?.provider)}
                      </td>
                      {displayTenantProduct && (
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
                        <span className='inline-flex items-baseline'>
                          <IconButton
                            tooltip={t('edit')}
                            Icon={PencilIcon}
                            className='hover:text-green-200'
                            onClick={() => {
                              router.push(
                                setupToken
                                  ? `/setup/${setupToken}/sso-connection/edit/${connection.clientID}`
                                  : `/admin/sso-connection/edit/${connection.clientID}`
                              );
                            }}
                          />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            itemsCount={connections.length}
            offset={paginate.offset}
            onPrevClick={() => {
              setPaginate({
                offset: paginate.offset - pageLimit,
              });
            }}
            onNextClick={() => {
              setPaginate({
                offset: paginate.offset + pageLimit,
              });
            }}
          />
        </>
      )}
    </div>
  );
};

export default ConnectionList;
