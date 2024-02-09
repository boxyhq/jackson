import { useEffect } from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import type { NextPage } from 'next';
import useSWR from 'swr';
import usePaginate from '@lib/ui/hooks/usePaginate';
import { fetcher } from '@lib/ui/utils';
import type { ApiSuccess, ApiError } from 'types';
import type { Trace } from '@boxyhq/saml-jackson';
import { pageLimit, Pagination, NoMoreResults } from '@components/Pagination';
import Loading from '@components/Loading';
import { errorToast } from '@components/Toaster';
import { useTranslation } from 'next-i18next';
import EmptyState from '@components/EmptyState';
import Link from 'next/link';

const SSOTraceViewer: NextPage = () => {
  const { t } = useTranslation('common');
  const { paginate, setPaginate, pageTokenMap, setPageTokenMap } = usePaginate();

  let getSSOTracesUrl = `/api/admin/sso-tracer?offset=${paginate.offset}&limit=${pageLimit}`;
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
          <div className='rounder border'>
            <table className='w-full text-left text-sm text-gray-500 dark:text-gray-400'>
              <thead className='bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400'>
                <tr className='hover:bg-gray-50'>
                  <th className='px-6 py-3'>{t('trace_id')}</th>
                  <th className='px-6 py-3'>{t('timestamp')}</th>
                  <th className='px-6 py-3'>{t('assertion_type')}</th>
                  <th className='px-6 py-3'>{t('error')}</th>
                </tr>
              </thead>
              <tbody>
                {traces?.map(({ traceId, timestamp, context, error }) => {
                  return (
                    <tr
                      key={traceId}
                      className='border-b bg-white last:border-b-0 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800'>
                      <td className='px-6 py-3'>
                        <Link
                          href={`/admin/sso-tracer/${traceId}/inspect`}
                          className='link-primary link flex'>
                          {traceId}
                        </Link>
                      </td>
                      <td className='whitespace-nowrap px-6 py-3'>{new Date(timestamp).toLocaleString()}</td>
                      <td className='px-6 py-3'>
                        {context?.samlResponse ? 'Response' : context?.samlRequest ? 'Request' : '-'}
                      </td>
                      <td className='px-6'>{error}</td>
                    </tr>
                  );
                })}
                {noMoreResults && <NoMoreResults colSpan={4} />}
              </tbody>
            </table>
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
          </div>
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
