import type { NextPage, GetServerSideProps } from 'next';
import type { WebhookEventLog, Directory } from "@lib/jackson";
import React from 'react';
import jackson from '@lib/jackson';
import { Badge } from '@supabase/ui'
import DirectoryTab from '@components/dsync/DirectoryTab';
import { EyeIcon } from '@heroicons/react/outline';
import Link from 'next/link';
import EmptyState from '@components/EmptyState';

const Events: NextPage<{ directory: Directory, events: WebhookEventLog[] }> = ({ directory, events }) => {
  if(events.length === 0) {
    return (
      <>
        <Header title={directory.name} />
        <DirectoryTab directory={directory} activeTab="events" />
        <EmptyState title="No webhook events found" />
      </>
    )
  }

  return (
    <>
      <Header title={directory.name} />
      <DirectoryTab directory={directory} activeTab="events" />
      <div className='rounded border w-3/4'>
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">
                Event Type
              </th>
              <th scope="col" className="px-6 py-3">
                Sent At
              </th>
              <th scope="col" className="px-6 py-3">
                Status Code
              </th>
              <th scope="col" className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => {
              return (
                <tr key={event.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                  <td className="px-6 py-3 font-semibold">{event.event}</td>
                  <td className="px-6 py-3">{event.created_at.toString()}</td>
                  <td className="px-6 py-3">{event.status_code === 200 ? <Badge color="green">200</Badge> : <Badge color="red">{`${event.status_code}`}</Badge> }</td>
                  <td className="px-6 py-3">
                    <Link href={`/admin/directory-sync/${directory.id}/events/${event.id}`}>
                      <a>
                        <EyeIcon className='h-5 w-5' />
                      </a>
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

const Header = ({title}) => {
  return (
    <div className='flex items-center justify-between mb-4'>
      <h2 className='font-bold text-primary dark:text-white md:text-2xl'>{title}</h2>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { directoryId } = context.query;
  const { directorySync } = await jackson();

  const directory = await directorySync.directories.get(directoryId as string);
  const events = await directorySync.events.with(directory.tenant, directory.product).getAll();

  return {
    props: {
      directory,
      events,
    },
  }
}

export default Events;