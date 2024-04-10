import { useEffect, useState } from 'react';
import type { SecurityLogsConfig } from '@boxyhq/saml-jackson';
import useSWR from 'swr';
import { ConfirmationModal, EmptyState, LinkPrimary, Loading, pageLimit, Pagination, Table } from '../shared';
import { useTranslation } from 'next-i18next';
import PencilIcon from '@heroicons/react/24/outline/PencilIcon';
import PlusIcon from '@heroicons/react/24/outline/PlusIcon';

import { addQueryParamsToPath, fetcher } from '../utils';
import { usePaginate, useRouter } from '../hooks';
import { TableBodyType } from '../shared/Table';
import { ApiError, ApiSuccess } from '../types';
import { getDisplayTypeFromSinkType } from './lib';
import { Error } from '../shared';
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';

export const SecurityLogsConfigs = ({
  urls,
  skipColumns,
  onError,
  onSuccess,
}: {
  urls: {
    getConfigs: string;
    createConfig: string;
    editLink: (id: string) => string;
    deleteConfig?: (id: string) => string;
  };
  onSuccess?: (id: string) => void;
  onError?: (message: string) => void;
  skipColumns?: string[];
}) => {
  const { t } = useTranslation('common');
  const { router } = useRouter();

  const [connection, setConnection] = useState<string | null>(null);
  const [delModalVisible, setDelModalVisible] = useState(false);
  const { paginate, setPaginate, pageTokenMap, setPageTokenMap } = usePaginate(router!);

  const params = {
    pageOffset: paginate.offset,
    pageLimit: pageLimit,
  };

  // For DynamoDB
  if (paginate.offset > 0 && pageTokenMap[paginate.offset - pageLimit]) {
    params['pageToken'] = pageTokenMap[paginate.offset - pageLimit];
  }

  const getConfigsUrl = addQueryParamsToPath(urls.getConfigs, params);

  const { data, error, isLoading, mutate } = useSWR<ApiSuccess<SecurityLogsConfig[]>, ApiError>(
    getConfigsUrl,
    fetcher
  );

  // Delete Splunk Connection
  const deleteSplunkConnection = async () => {
    const response = await fetch(urls.deleteConfig!(connection!), {
      method: 'DELETE',
    });
    const data = await response.json();
    if (data?.data) {
      mutate();
      setConnection(null);
      setDelModalVisible(false);
      onSuccess!(t('bui-slc-delete-success'));
    } else {
      onError!(data?.error);
    }
  };

  const nextPageToken = data?.pageToken;

  // store the nextPageToken against the pageOffset
  useEffect(() => {
    if (nextPageToken) {
      setPageTokenMap((tokenMap) => ({ ...tokenMap, [paginate.offset]: nextPageToken }));
    }
  }, [nextPageToken, paginate.offset]);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error.message} />;
  }

  const configs = data?.data || [];
  const noConfigs = configs.length === 0 && paginate.offset === 0;
  const noMoreResults = configs.length === 0 && paginate.offset > 0;

  let columns = [
    {
      key: 'name',
      label: t('bui-shared-name'),
      wrap: true,
      dataIndex: 'name',
    },
    {
      key: 'type',
      label: t('bui-shared-type'),
      wrap: true,
      dataIndex: 'type',
    },
    {
      key: 'tenant',
      label: t('bui-shared-tenant'),
      wrap: true,
      dataIndex: 'tenant',
    },
    {
      key: 'endpoint',
      label: t('bui-shared-endpoint'),
      wrap: true,
      dataIndex: 'config.endpoint',
    },
    {
      key: 'actions',
      label: t('bui-shared-actions'),
      wrap: true,
      dataIndex: null,
    },
  ];

  if (skipColumns) {
    columns = columns.filter((column) => !skipColumns.includes(column.key));
  }

  const cols = columns.map(({ label }) => label);

  const body: TableBodyType[] = configs.map((config) => {
    return {
      id: config.id,
      cells: columns.map((column) => {
        const dataIndex = column.dataIndex as string;

        if (dataIndex === null) {
          return {
            actions: urls.deleteConfig
              ? [
                  {
                    text: t('bui-shared-edit'),
                    onClick: () => router?.replace(urls.editLink(config.id)),
                    icon: <PencilIcon className='w-5' />,
                  },
                  {
                    color: 'error',
                    text: t('bui-shared-delete'),
                    icon: <TrashIcon className='h-5 w-5' />,
                    onClick: () => {
                      setConnection(config.id);
                      setDelModalVisible(true);
                    },
                  },
                ]
              : [
                  {
                    text: t('bui-shared-edit'),
                    onClick: () => router?.replace(urls.editLink(config.id)),
                    icon: <PencilIcon className='w-5' />,
                  },
                ],
          };
        } else if (dataIndex.indexOf('.') !== -1) {
          const keys = dataIndex.split('.');
          const retValue = {
            wrap: column.wrap,
            text: config,
          };
          for (let i = 0; i < keys.length; i++) {
            retValue.text = retValue.text ? retValue.text[keys[i]] : '';
          }
          return retValue;
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
        <h2 className='font-bold text-gray-700 dark:text-white md:text-xl'>{t('bui-slc')}</h2>
        <div className='flex'>
          <LinkPrimary className='m-2' Icon={PlusIcon} href={urls.createConfig}>
            {t('bui-slc-new')}
          </LinkPrimary>
        </div>
      </div>
      {noConfigs ? (
        <>
          <EmptyState title={t('bui-slc-empty')} />
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
          <ConfirmationModal
            title='Delete Splunk Connection'
            visible={delModalVisible}
            description={t('bui-slc-delete-modal-confirmation')}
            onConfirm={() => deleteSplunkConnection()}
            onCancel={() => setDelModalVisible(false)}
          />
        </>
      )}
    </>
  );
};
