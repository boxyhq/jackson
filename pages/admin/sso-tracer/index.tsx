import { useEffect } from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { NextPage } from 'next';
import useSWR from 'swr';
import usePaginate from '@lib/ui/hooks/usePaginate';
import { fetcher } from '@lib/ui/utils';
import type { ApiSuccess, ApiError } from 'types';
import type { Trace } from '@boxyhq/saml-jackson';
import { pageLimit, Pagination } from '@components/Pagination';
import Loading from '@components/Loading';
import { errorToast } from '@components/Toaster';
import { useTranslation } from 'next-i18next';
import EmptyState from '@components/EmptyState';
import Link from 'next/link';
import { Table } from '@components/table/Table';

const SSOTraceViewer: NextPage = () => {
  const { t } = useTranslation('common');
  const { paginate, setPaginate, pageTokenMap, setPageTokenMap } = usePaginate();

  let getSSOTracesUrl = `/api/admin/sso-tracer?pageOffset=${paginate.offset}&pageLimit=${pageLimit}`;
  // Use the (next)pageToken mapped to the previous page offset to get the current page
  if (paginate.offset > 0 && pageTokenMap[paginate.offset - pageLimit]) {
    getSSOTracesUrl += `&pageToken=${pageTokenMap[paginate.offset - pageLimit]}`;
  }

  const { data, error, isLoading } = useSWR<ApiSuccess<Trace[]>, ApiError>(getSSOTracesUrl, fetcher);

  const nextPageToken = data?.pageToken;
  // store the nextPageToken against the pageOffset
  useEffect(() => {
    if (nextPageToken) {
      setPageTokenMap((tokenMap) => ({ ...tokenMap, [paginate.offset]: nextPageToken }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextPageToken, paginate.offset]);

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    errorToast(error.message);
    return null;
  }

  const traces = data?.data || [];
  const noTraces = traces.length === 0 && paginate.offset === 0;
  const noMoreResults = traces.length === 0 && paginate.offset > 0;

  return (
    <>
      <div className='mb-5 flex items-center justify-between'>
        <h2 className='font-bold text-gray-700 dark:text-white md:text-xl'>{t('sso_tracer')}</h2>
      </div>
      {noTraces ? (
        <>
          <EmptyState title={t('no_sso_traces_found')} />
        </>
      ) : (
        <>
          <Table
            noMoreResults={noMoreResults}
            cols={[t('trace_id'), t('description'), t('assertion_type'), t('timestamp')]}
            body={traces.map((trace) => {
              return {
                id: trace.traceId,
                cells: [
                  {
                    wrap: true,
                    element: (
                      <Link
                        href={`/admin/sso-tracer/${trace.traceId}/inspect`}
                        className='link-primary link flex'>
                        {trace.traceId}
                      </Link>
                    ),
                  },
                  {
                    wrap: true,
                    text: trace.error,
                  },
                  {
                    wrap: true,
                    text: trace.context?.samlResponse
                      ? 'Response'
                      : trace?.context.samlRequest
                        ? 'Request'
                        : '-',
                  },
                  {
                    wrap: true,
                    text: new Date(trace.timestamp).toLocaleString(),
                  },
                ],
              };
            })}></Table>

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
    </>
  );
};

export default SSOTraceViewer;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
