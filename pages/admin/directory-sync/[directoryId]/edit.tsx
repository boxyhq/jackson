import type { NextPage, GetServerSidePropsContext } from 'next';
import React from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/outline';

import jackson from '@lib/jackson';
import { inferSSRProps } from '@lib/inferSSRProps';
import classNames from 'classnames';

const Edit: NextPage<inferSSRProps<typeof getServerSideProps>> = ({
  directory: { id, name, log_webhook_events, webhook },
}) => {
  const router = useRouter();
  const [directory, setDirectory] = React.useState({
    name,
    log_webhook_events,
    webhook_url: webhook.endpoint,
    webhook_secret: webhook.secret,
  });

  const [loading, setLoading] = React.useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);

    const rawResponse = await fetch(`/api/admin/directory-sync/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(directory),
    });

    setLoading(false);

    const { data, error } = await rawResponse.json();

    if (error) {
      toast.error(error.message);
      return;
    }

    if (data) {
      toast.success('Directory updated successfully');
      router.replace('/admin/directory-sync');
    }
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const target = event.target as HTMLInputElement;
    const value = target.type === 'checkbox' ? target.checked : target.value;

    setDirectory({
      ...directory,
      [target.id]: value,
    });
  };

  return (
    <div>
      <Link href='/admin/directory-sync'>
        <a className='btn btn-outline items-center space-x-2'>
          <ArrowLeftIcon aria-hidden className='h-4 w-4' />
          <span>Back</span>
        </a>
      </Link>
      <h2 className='mb-5 mt-5 font-bold text-gray-700 md:text-xl'>Update Directory</h2>
      <div className='min-w-[28rem] rounded border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800 md:w-3/4 md:max-w-lg'>
        <form onSubmit={onSubmit}>
          <div className='flex flex-col space-y-3'>
            <div className='form-control w-full'>
              <label className='label'>
                <span className='label-text'>Directory name</span>
              </label>
              <input
                type='text'
                id='name'
                className='input input-bordered w-full'
                required
                onChange={onChange}
                value={directory.name}
              />
            </div>
            <div className='form-control w-full'>
              <label className='label'>
                <span className='label-text'>Webhook URL</span>
              </label>
              <input
                type='text'
                id='webhook_url'
                className='input input-bordered w-full'
                onChange={onChange}
                value={directory.webhook_url}
              />
            </div>
            <div className='form-control w-full'>
              <label className='label'>
                <span className='label-text'>Webhook secret</span>
              </label>
              <input
                type='text'
                id='webhook_secret'
                className='input input-bordered w-full'
                onChange={onChange}
                value={directory.webhook_secret}
              />
            </div>
            <div className='form-control w-full py-2'>
              <div className='flex items-center'>
                <input
                  id='log_webhook_events'
                  type='checkbox'
                  checked={directory.log_webhook_events}
                  onChange={onChange}
                  className='h-4 w-4 rounded border-gray-300 bg-gray-100 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600'
                />
                <label className='ml-2 text-sm font-medium text-gray-900 dark:text-gray-300'>
                  Enable Webhook events logging
                </label>
              </div>
            </div>
            <div>
              <button className={classNames('btn btn-primary', loading ? 'loading' : '')}>
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
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

  return {
    props: {
      directory,
    },
  };
};

export default Edit;
