import useSWR from 'swr';
import { useState } from 'react';
import type { NextRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { EyeIcon } from '@heroicons/react/24/outline';
import type { WebhookEventLog } from '@boxyhq/saml-jackson';
import { fetcher } from '../utils';
import { DirectoryTab } from '../dsync';
import { usePaginate, useDirectory } from '../hooks';
import { TableBodyType } from '../shared/Table';
import {
  Loading,
  Table,
  EmptyState,
  Error,
  Pagination,
  PageHeader,
  pageLimit,
  DeleteConfirmationModal,
} from '../shared';
import { ButtonDanger } from '../shared/ButtonDanger';

// TODO:
// Button to delete logs

export const DirectoryWebhookLogs = ({
  urls,
  onView,
  onDelete,
  router,
}: {
  urls: { getEvents: string; getDirectory: string; tabBase: string; deleteEvents?: string };
  onView?: (event: WebhookEventLog) => void;
  onDelete?: () => void;
  router: NextRouter;
}) => {
  const { t } = useTranslation('common');
  const [delModalVisible, setDelModalVisible] = useState(false);
  const { paginate, setPaginate, pageTokenMap } = usePaginate(router);

  let getUrl = `${urls.getEvents}?offset=${paginate.offset}&limit=${pageLimit}`;

  // For DynamoDB
  if (paginate.offset > 0 && pageTokenMap[paginate.offset - pageLimit]) {
    getUrl += `&pageToken=${pageTokenMap[paginate.offset - pageLimit]}`;
  }

  const { directory, isLoadingDirectory, directoryError } = useDirectory(urls.getDirectory);
  const { data, isLoading, error } = useSWR<{ data: WebhookEventLog[] }>(getUrl, fetcher);

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

  const columns = [
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
      label: t('bui-dsync-actions'),
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
                onClick: () => onView?.(event),
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

  const removeEvents = async () => {
    if (!urls.deleteEvents) {
      return;
    }

    await fetch(urls.deleteEvents, {
      method: 'DELETE',
    });

    onDelete?.();
  };

  return (
    <div className='py-2'>
      <PageHeader title={directory.name} />
      <DirectoryTab activeTab='events' baseUrl={urls.tabBase} />
      {noEvents ? (
        <EmptyState title={t('bui-dsync-no-events')} />
      ) : (
        <>
          {urls.deleteEvents && (
            <>
              <div className='py-2 flex justify-end'>
                <ButtonDanger onClick={() => setDelModalVisible(true)}>
                  {t('bui-dsync-remove-events')}
                </ButtonDanger>
              </div>
              <DeleteConfirmationModal
                title={t('bui-dsync-delete-events-title')}
                description={t('bui-dsync-delete-events-desc')}
                visible={delModalVisible}
                onConfirm={() => removeEvents()}
                onCancel={() => setDelModalVisible(false)}
              />
            </>
          )}
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
        </>
      )}
    </div>
  );
};
