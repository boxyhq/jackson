import type { NextPage, GetServerSidePropsContext } from 'next';
import React from 'react';
import { EyeIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/router';
import classNames from 'classnames';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import useSWR from 'swr';
import type { WebhookEventLog } from '@boxyhq/saml-jackson';

import EmptyState from '@components/EmptyState';
import DirectoryTab from '@components/dsync/DirectoryTab';
import Badge from '@components/Badge';
import type { ApiError, ApiSuccess } from 'types';
import { fetcher } from '@lib/ui/utils';
import { errorToast } from '@components/Toaster';
import Loading from '@components/Loading';
import useDirectory from '@lib/ui/hooks/useDirectory';
import { LinkBack } from '@components/LinkBack';

const Events: NextPage = () => {
  const { t } = useTranslation('common');
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  const { directoryId } = router.query as { directoryId: string };

  const { directory, isLoading: isDirectoryLoading, error: directoryError } = useDirectory(directoryId);

  const { data: eventsData, error: eventsError } = useSWR<ApiSuccess<WebhookEventLog[]>, ApiError>(
    `/api/admin/directory-sync/${directoryId}/events`,
    fetcher
  );

  if (isDirectoryLoading || !eventsData) {
    return <Loading />;
  }

  const error = directoryError || eventsError;

  if (error) {
    errorToast(error.message);
    return null;
  }

  if (!directory) {
    return null;
  }

  const events = eventsData.data;

  const clearEvents = async () => {
    setLoading(true);

    await fetch(`/api/admin/directory-sync/${directoryId}/events`, {
      method: 'DELETE',
    });

    setLoading(false);

    router.reload();
  };

  return (
    <>
      <LinkBack href='/admin/directory-sync' />
      <h2 className='mt-5 font-bold text-gray-700 md:text-xl'>{directory.name}</h2>
      <div className='w-full md:w-3/4'>
        <DirectoryTab directory={directory} activeTab='events' />
        {events.length === 0 ? (
          <EmptyState title='No webhook events found' />
        ) : (
          <>
            <div className='my-3 flex justify-end'>
              <button
                onClick={clearEvents}
                className={classNames('btn-error btn-sm btn', loading ? 'loading' : '')}>
                {t('clear_events')}
              </button>
            </div>
            <div className='rounded border'>
              <table className='w-full text-left text-sm text-gray-500 dark:text-gray-400'>
                <thead className='bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400'>
                  <tr>
                    <th scope='col' className='px-6 py-3'>
                      {t('event_type')}
                    </th>
                    <th scope='col' className='px-6 py-3'>
                      {t('sent_at')}
                    </th>
                    <th scope='col' className='px-6 py-3'>
                      {t('status_code')}
                    </th>
                    <th scope='col' className='px-6 py-3'></th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => {
                    return (
                      <tr
                        key={event.id}
                        className='border-b bg-white last:border-b-0 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600'>
                        <td className='px-6 py-3 font-semibold'>{event.event}</td>
                        <td className='px-6 py-3'>{event.created_at.toString()}</td>
                        <td className='px-6 py-3'>
                          {event.status_code === 200 ? (
                            <Badge vairant='success'>200</Badge>
                          ) : (
                            <Badge vairant='error'>{`${event.status_code}`}</Badge>
                          )}
                        </td>
                        <td className='px-6 py-3'>
                          <Link href={`/admin/directory-sync/${directoryId}/events/${event.id}`}>
                            <EyeIcon className='h-5 w-5' />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const { locale }: GetServerSidePropsContext = context;

  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
};

export default Events;
