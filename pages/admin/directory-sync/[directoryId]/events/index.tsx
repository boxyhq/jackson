import type { NextPage, GetServerSidePropsContext } from 'next';
import type { Directory } from '@lib/jackson';
import React from 'react';
import jackson from '@lib/jackson';
import { Badge, Alert, Button } from '@supabase/ui';
import { EyeIcon } from '@heroicons/react/outline';
import Link from 'next/link';
import EmptyState from '@components/EmptyState';
import DirectoryTab from '@components/dsync/DirectoryTab';
import { useRouter } from 'next/router';
import { inferSSRProps } from '@lib/inferSSRProps';

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

  if (events.length === 0) {
    return (
      <>
        <Header title={directory.name} />
        <DirectoryTab directory={directory} activeTab='events' />
        <div className='w-3/4'>
          <WebhookEventLoggingAlert directory={directory} />
          <EmptyState title='No webhook events found' />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title={directory.name} />
      <DirectoryTab directory={directory} activeTab='events' />
      <div className='w-3/4'>
        <WebhookEventLoggingAlert directory={directory} />
        <div className='mb-3 flex justify-end'>
          <Button danger onClick={clearEvents} loading={loading}>
            Clear Events
          </Button>
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
                    className='border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600'>
                    <td className='px-6 py-3 font-semibold'>{event.event}</td>
                    <td className='px-6 py-3'>{event.created_at.toString()}</td>
                    <td className='px-6 py-3'>
                      {event.status_code === 200 ? (
                        <Badge color='green'>200</Badge>
                      ) : (
                        <Badge color='red'>{`${event.status_code}`}</Badge>
                      )}
                    </td>
                    <td className='px-6 py-3'>
                      <Link href={`/admin/directory-sync/${directory.id}/events/${event.id}`}>
                        <a>
                          <EyeIcon className='h-5 w-5' />
                        </a>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

const Header = ({ title }: { title: string }) => {
  return (
    <div className='mb-4 flex items-center justify-between'>
      <h2 className='font-bold text-primary dark:text-white md:text-2xl'>{title}</h2>
    </div>
  );
};

const WebhookEventLoggingAlert = ({ directory }: { directory: Directory }) => {
  if (directory.log_webhook_events) {
    return null;
  }

  return (
    <Alert title='Alert' variant='warning' className='mb-4'>
      Webhook events are not being logged for this directory.{' '}
      <Link href={`/admin/directory-sync/${directory.id}/edit`}>
        <a className='underline'>Enable logging</a>
      </Link>
    </Alert>
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

  const events = await directorySyncController.events.with(directory.tenant, directory.product).getAll();

  return {
    props: {
      directory,
      events,
    },
  };
};

export default Events;
