import useSWR from 'swr';
import { useTranslation } from 'next-i18next';
import { EyeIcon } from '@heroicons/react/24/outline';
import type { User } from '@boxyhq/saml-jackson';
import { addQueryParamsToPath, fetcher } from '../utils';
import { DirectoryTab } from '../dsync';
import { usePaginate, useDirectory } from '../hooks';
import { TableBodyType } from '../shared/Table';
import { Loading, Table, EmptyState, Error, Pagination, PageHeader, pageLimit } from '../shared';
import { useRouter } from '../hooks';
import { Trace } from '@boxyhq/saml-jackson';
import { useEffect } from 'react';

export type ApiSuccess<T> = { data: T; pageToken?: string };

export interface ApiError extends Error {
  info?: string;
  status: number;
}

export const SSOTracers = ({ urls }: { urls: { getTracers: string }; onView: (user: Trace) => void }) => {
  const { router } = useRouter();
  const { t } = useTranslation('common');
  const { paginate, setPaginate, pageTokenMap, setPageTokenMap } = usePaginate(router!);

  const params = {
    offset: paginate.offset,
    limit: pageLimit,
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

  console.log({ data, isLoading, error });

  return <>Tracers</>;
};
