import LinkIcon from '@heroicons/react/24/outline/LinkIcon';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { LinkPrimary } from '@components/LinkPrimary';
import { InputWithCopyButton } from '@components/ClipboardButton';
import { pageLimit } from '@components/Pagination';
import type { OIDCSSORecord, SAMLSSORecord } from '@boxyhq/saml-jackson';
import useSWR from 'swr';
import { fetcher } from '@lib/ui/utils';
import Loading from '@components/Loading';
import { errorToast } from '@components/Toaster';
import type { ApiError, ApiSuccess } from 'types';
import { ConnectionList } from '@boxyhq/react-ui/sso';

const SSOConnectionList = ({
  setupLinkToken,
  idpEntityID,
  isSettingsView = false,
}: {
  setupLinkToken?: string;
  idpEntityID?: string;
  isSettingsView?: boolean;
}) => {
  const { t } = useTranslation('common');
  const router = useRouter();

  const displayTenantProduct = setupLinkToken ? false : true;
  const getConnectionsUrl = setupLinkToken
    ? `/api/setup/${setupLinkToken}/sso-connection`
    : isSettingsView
      ? `/api/admin/connections?isSystemSSO`
      : `/api/admin/connections`;

  const createConnectionUrl = setupLinkToken
    ? `/setup/${setupLinkToken}/sso-connection/new`
    : isSettingsView
      ? `/admin/settings/sso-connection/new`
      : '/admin/sso-connection/new';

  const { data, error, isLoading } = useSWR<
    ApiSuccess<((SAMLSSORecord | OIDCSSORecord) & { isSystemSSO?: boolean })[]>,
    ApiError
  >(getConnectionsUrl, fetcher, { revalidateOnFocus: false });

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    errorToast(error.message);
    return null;
  }

  const connections = data?.data || [];

  if (connections && setupLinkToken && connections.length === 0) {
    router.replace(`/setup/${setupLinkToken}/sso-connection/new`);
    return null;
  }

  return (
    <div>
      <div className='mb-5 flex items-center justify-between'>
        <h2 className='font-bold text-gray-700 dark:text-white md:text-xl'>
          {t(isSettingsView ? 'admin_portal_sso' : 'enterprise_sso')}
        </h2>
        <div className='flex gap-2'>
          {!setupLinkToken && !isSettingsView && (
            <LinkPrimary
              Icon={LinkIcon}
              href='/admin/sso-connection/setup-link/new'
              data-testid='create-setup-link'>
              {t('new_setup_link')}
            </LinkPrimary>
          )}
          <LinkPrimary href={createConnectionUrl} data-testid='create-connection'>
            {t('new_connection')}
          </LinkPrimary>
        </div>
      </div>
      {idpEntityID && setupLinkToken && (
        <div className='mb-5 mt-5 items-center justify-between'>
          <div className='form-control'>
            <InputWithCopyButton text={idpEntityID} label={t('idp_entity_id')} />
          </div>
        </div>
      )}

      <ConnectionList
        urls={{
          get: getConnectionsUrl,
        }}
        cols={!displayTenantProduct ? ['name', 'label', 'provider', 'type', 'status', 'actions'] : undefined}
        paginate={{
          itemsPerPage: pageLimit,
          handlePageChange: ({ offset }) => {
            const currentOffset = router.query.offset;
            if (currentOffset !== `${offset}`) {
              router.query.offset = `${offset}`;
              router.push(router);
            }
          },
        }}
        handleActionClick={(action: 'edit', payload: any) => {
          const isSystemSSO = payload?.isSystemSSO;
          router.push(
            setupLinkToken
              ? `/setup/${setupLinkToken}/sso-connection/edit/${payload.clientID}`
              : isSettingsView || isSystemSSO
                ? `/admin/settings/sso-connection/edit/${payload.clientID}`
                : `/admin/sso-connection/edit/${payload.clientID}`
          );
        }}
      />
    </div>
  );
};

export default SSOConnectionList;
