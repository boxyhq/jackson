import useSWR from 'swr';
import { useEffect } from 'react';
import { useTranslation } from 'next-i18next';

import type { Trace } from '../types';
import { usePaginate, useRouter } from '../hooks';
import type { ApiError, ApiSuccess } from '../types';
import { addQueryParamsToPath, fetcher } from '../utils';
import { Loading, Table, EmptyState, Error, Pagination, PageHeader, pageLimit } from '../shared';

export const SSOTracers = ({
  urls,
  onView,
}: {
  urls: { getTracers: string };
  onView: (user: Trace) => void;
}) => {
  const { router } = useRouter();
  const { t } = useTranslation('common');
  const { paginate, setPaginate, pageTokenMap, setPageTokenMap } = usePaginate(router!);

  const params = {
    pageOffset: paginate.offset,
    pageLimit,
  };

  // For DynamoDB
  if (paginate.offset > 0 && pageTokenMap[paginate.offset - pageLimit]) {
    params['pageToken'] = pageTokenMap[paginate.offset - pageLimit];
  }

  const getUrl = addQueryParamsToPath(urls.getTracers, params);
  const { data, isLoading, error } = useSWR<ApiSuccess<Trace[]>, ApiError>(getUrl, fetcher);

  const nextPageToken = data?.pageToken;

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

  if (!data) {
    return null;
  }

  const traces = data?.data || [];
  const noTraces = traces.length === 0 && paginate.offset === 0;
  const noMoreResults = traces.length === 0 && paginate.offset > 0;

  const cols = [
    t('bui-tracer-id'),
    t('bui-tracer-description'),
    t('bui-tracer-assertion-type'),
    t('bui-tracer-timestamp'),
  ];

  const body = traces.map((trace) => {
    return {
      id: trace.traceId,
      cells: [
        {
          wrap: true,
          element: (
            <button className='link-primary link flex' onClick={() => onView(trace)}>
              {trace.traceId}
            </button>
          ),
        },
        {
          wrap: true,
          text: trace.error,
        },
        {
          wrap: true,
          text: trace.context?.samlResponse
            ? t('bui-tracer-response')
            : trace?.context.samlRequest
              ? t('bui-tracer-request')
              : '-',
        },
        {
          wrap: true,
          text: new Date(trace.timestamp).toLocaleString(),
        },
      ],
    };
  });

  return (
    <div className='space-y-3'>
      <PageHeader title={t('bui-tracer-title')} />
      {noTraces ? (
        <EmptyState title={t('bui-tracer-no-traces')} />
      ) : (
        <>
          <Table noMoreResults={noMoreResults} cols={cols} body={body} />
          <Pagination
            itemsCount={traces.length}
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
