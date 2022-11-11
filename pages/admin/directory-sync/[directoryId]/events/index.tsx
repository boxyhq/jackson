import type { NextPage, GetServerSidePropsContext } from 'next';
import React from 'react';
import { EyeIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/router';

import jackson from '@lib/jackson';
import EmptyState from '@components/EmptyState';
import DirectoryTab from '@components/dsync/DirectoryTab';
import { inferSSRProps } from '@lib/inferSSRProps';
import Badge from '@components/Badge';
import classNames from 'classnames';

const Events: NextPage<inferSSRProps<typeof getServerSideProps>> = ({ directory, events }) => {
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  const clearEvents = async () => {
    setLoading(true);

    await fetch(`/api/admin/directory-sync/${directory.id}/events`, {
      method: 'DELETE',
    });

    setLoading(false);

    router.reload();
  };

  return (
    <>
      <h2 className='font-bold text-gray-700 md:text-xl'>{directory.name}</h2>
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
                Clear Events
              </button>
            </div>
            <div className='rounded border'>
              <table className='w-full text-left text-sm text-gray-500 dark:text-gray-400'>
                <thead className='bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400'>
                  <tr>
                    <th scope='col' className='px-6 py-3'>
                      Event Type
                    </th>
                    <th scope='col' className='px-6 py-3'>
                      Sent At
                    </th>
                    <th scope='col' className='px-6 py-3'>
                      Status Code
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
                          <Link href={`/admin/directory-sync/${directory.id}/events/${event.id}`}>
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
  const { directoryId } = context.query;
  const { directorySyncController } = await jackson();

  const { data: directory } = await directorySyncController.directories.get(directoryId as string);

  if (!directory) {
    return {
      notFound: true,
    };
  }

  const events = await directorySyncController.webhookLogs.with(directory.tenant, directory.product).getAll();

  return {
    props: {
      directory,
      events,
    },
  };
};

export default Events;
