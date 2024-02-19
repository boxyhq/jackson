import useSWR from 'swr';
import fetcher from '../utils/fetcher';
import { Loading, Table, EmptyState, Error, Pagination, PageHeader } from '../shared';
import { useTranslation } from 'next-i18next';
import type { WebhookEventLog } from '@boxyhq/saml-jackson';
import { EyeIcon } from '@heroicons/react/24/outline';
import { TableBodyType } from '../shared/Table';
import { pageLimit } from '../shared/Pagination';
import { usePaginate } from '../hooks';
import { DirectoryTab } from './DirectoryTab';
import type { NextRouter } from 'next/router';
import { useEffect } from 'react';
import { useDirectory } from '../hooks';

// TODO:
// Button to delete logs

export const DirectoryWebhookLogs = ({
  urls,
  onEdit,
  router,
}: {
  urls: { get: string; getDirectory: string };
  onEdit?: (event: WebhookEventLog) => void;
  router: NextRouter;
}) => {
  const { t } = useTranslation('common');
  const { paginate, setPaginate, pageTokenMap, setPageTokenMap } = usePaginate(router);

  let getUrl = `${urls.get}?offset=${paginate.offset}&limit=${pageLimit}`;

  // For DynamoDB
  if (paginate.offset > 0 && pageTokenMap[paginate.offset - pageLimit]) {
    getUrl += `&pageToken=${pageTokenMap[paginate.offset - pageLimit]}`;
  }

  const { directory, isLoadingDirectory, directoryError } = useDirectory(urls.getDirectory);
  const { data, isLoading, error } = useSWR<{ data: WebhookEventLog[] }>(getUrl, fetcher);

  const nextPageToken = ''; //data?.pageToken;

  useEffect(() => {
    if (nextPageToken) {
      setPageTokenMap((tokenMap) => ({ ...tokenMap, [paginate.offset]: nextPageToken }));
    }
  }, [nextPageToken, paginate.offset]);

  if (isLoading || isLoadingDirectory) {
    return <Loading />;
  }

  if (error || directoryError) {
    return <Error message={error.message || directoryError.message} />;
  }

  if (!data || !directory) {
    return null;
  }

  const events = data?.data || [];
  const noEvents = events.length === 0 && paginate.offset === 0;
  const noMoreResults = events.length === 0 && paginate.offset > 0;

  if (noEvents) {
    return <EmptyState title={t('bui-dsync-no-events')} />;
  }

  let columns = [
    {
      key: 'webhook_endpoint',
      label: t('bui-dsync-webhook-endpoint'),
      wrap: true,
      dataIndex: 'webhook_endpoint',
    },
    {
      key: 'status_code',
      label: t('bui-dsync-status-code'),
      wrap: true,
      dataIndex: 'status_code',
    },
    {
      key: 'created_at',
      label: t('bui-dsync-sent-at'),
      wrap: true,
      dataIndex: 'created_at',
    },
    {
      key: 'actions',
      label: t('bui-shared-actions'),
      wrap: true,
      dataIndex: null,
    },
  ];

  const cols = columns.map(({ label }) => label);

  const body: TableBodyType[] = events.map((event) => {
    return {
      id: event.id,
      cells: columns.map((column) => {
        const dataIndex = column.dataIndex as keyof typeof event;

        if (dataIndex === null) {
          return {
            actions: [
              {
                text: t('bui-dsync-view'),
                onClick: () => onEdit?.(event),
                icon: <EyeIcon className='w-5' />,
              },
            ],
          };
        }

        if (dataIndex === 'status_code') {
          return {
            badge: {
              text: event[dataIndex] as any,
              color: event[dataIndex] === 200 ? 'success' : 'error',
            },
          };
        }

        return {
          wrap: column.wrap,
          text: event[dataIndex] as string,
        };
      }),
    };
  });

  return (
    <div className='py-2'>
      <PageHeader title={directory.name} />
      <DirectoryTab directoryId='hello' activeTab='events' />
      <Table noMoreResults={noMoreResults} cols={cols} body={body} />
      <Pagination
        itemsCount={events.length}
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
    </div>
  );
};
