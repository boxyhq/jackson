import { useEffect } from 'react';
import type { SecurityLogsConfig } from '@boxyhq/saml-jackson';
import useSWR from 'swr';
import { useTranslation } from 'next-i18next';
import type { ApiError, ApiSuccess } from 'types';
import { fetcher } from '@lib/ui/utils';
import Loading from '@components/Loading';
import EmptyState from '@components/EmptyState';
import { LinkPrimary } from '@components/LinkPrimary';
import { pageLimit, Pagination, Table } from '@boxyhq/internal-ui';
import usePaginate from '@lib/ui/hooks/usePaginate';
import PencilIcon from '@heroicons/react/24/outline/PencilIcon';
import PlusIcon from '@heroicons/react/24/outline/PlusIcon';
import router from 'next/router';
import LicenseRequired from '@components/LicenseRequired';
import { errorToast } from '@components/Toaster';
import { getDisplayTypeFromSinkType } from '@lib/sinkConfigMap';
import { TableBodyType } from 'internal-ui/src/shared/Table';

const ConfigList = ({ hasValidLicense }: { hasValidLicense: boolean }) => {
  const { t } = useTranslation('common');
  const { paginate, setPaginate, pageTokenMap, setPageTokenMap } = usePaginate();

  let getAppsUrl = `/api/admin/security-logs-config?offset=${paginate.offset}&limit=${pageLimit}`;

  // Use the (next)pageToken mapped to the previous page offset to get the current page
  if (paginate.offset > 0 && pageTokenMap[paginate.offset - pageLimit]) {
    getAppsUrl += `&pageToken=${pageTokenMap[paginate.offset - pageLimit]}`;
  }

  const { data, error, isLoading } = useSWR<ApiSuccess<SecurityLogsConfig[]>, ApiError>(getAppsUrl, fetcher);

  const nextPageToken = data?.pageToken;

  // store the nextPageToken against the pageOffset
  useEffect(() => {
    if (nextPageToken) {
      setPageTokenMap((tokenMap) => ({ ...tokenMap, [paginate.offset]: nextPageToken }));
    }
  }, [nextPageToken, paginate.offset]);

  if (!hasValidLicense) {
    return <LicenseRequired />;
  }

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    errorToast(error.message);
    return;
  }

  const configs = data?.data || [];
  const noConfigs = configs.length === 0 && paginate.offset === 0;
  const noMoreResults = configs.length === 0 && paginate.offset > 0;

  const columns = [
    {
      key: 'name',
      label: t('bui-dsync-name'),
      wrap: true,
      dataIndex: 'name',
    },
    {
      key: 'type',
      label: t('bui-dsync-type'),
      wrap: true,
      dataIndex: 'type',
    },
    {
      key: 'tenant',
      label: t('bui-dsync-tenant'),
      wrap: true,
      dataIndex: 'tenant',
    },
    {
      key: 'actions',
      label: t('bui-dsync-actions'),
      wrap: true,
      dataIndex: null,
    },
  ];

  const cols = columns.map(({ label }) => label);

  const body: TableBodyType[] = configs.map((config) => {
    return {
      id: config.id,
      cells: columns.map((column) => {
        const dataIndex = column.dataIndex as string;

        if (dataIndex === null) {
          return {
            actions: [
              {
                text: t('bui-dsync-view'),
                onClick: () => router.push(`/admin/settings/security-logs/${config.id}/edit`),
                icon: <PencilIcon className='w-5' />,
              },
            ],
          };
        } else if (dataIndex === 'type') {
          return {
            wrap: column.wrap,
            text: getDisplayTypeFromSinkType(config.type),
          };
        } else {
          return {
            wrap: column.wrap,
            text: config[dataIndex],
          };
        }
      }),
    };
  });

  return (
    <>
      <div className='mb-5 flex items-center justify-between'>
        <h2 className='font-bold text-gray-700 dark:text-white md:text-xl'>{t('security_logs_configs')}</h2>
        <div className='flex'>
          <LinkPrimary className='m-2' Icon={PlusIcon} href='/admin/settings/security-logs/new'>
            {t('new_security_logs_config')}
          </LinkPrimary>
        </div>
      </div>
      {noConfigs ? (
        <>
          <EmptyState title={t('no_security_logs_config')} href='/admin/settings/security-logs/new' />
        </>
      ) : (
        <>
          <Table noMoreResults={noMoreResults} cols={cols} body={body} />
          <Pagination
            itemsCount={configs.length}
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
    </>
  );
};

export default ConfigList;
