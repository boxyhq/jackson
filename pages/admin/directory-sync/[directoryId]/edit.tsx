import type { NextPage, GetServerSideProps } from 'next';
import type { Directory } from '@lib/jackson';
import { Input, Button, Checkbox } from '@supabase/ui';
import React from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import jackson from '@lib/jackson';

const Edit: NextPage<{ directory: Directory }> = ({
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
      <div className='mb-4 flex items-center justify-between'>
        <h2 className='font-bold text-primary dark:text-white md:text-2xl'>Update Configuration</h2>
      </div>
      <div className='flex overflow-hidden'>
        <div className='w-1/2 rounded border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800'>
          <form onSubmit={onSubmit}>
            <Input
              label='Directory name'
              id='name'
              value={directory.name}
              className='mb-3'
              required
              onChange={onChange}
            />
            <Input
              label='Webhook URL'
              id='webhook_url'
              value={directory.webhook_url}
              className='mb-3'
              onChange={onChange}
            />
            <Input
              label='Webhook secret'
              id='webhook_secret'
              className='mb-3'
              value={directory.webhook_secret}
              onChange={onChange}
            />
            <Checkbox
              label='Enable Webhook events logging'
              id='log_webhook_events'
              onChange={onChange}
              checked={directory.log_webhook_events}
              className='mb-6 mt-6'
            />
            <Button size='small' loading={loading}>
              Save Changes
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { directoryId } = context.query;
  const { directorySync } = await jackson();

  return {
    props: {
      directory: await directorySync.directories.get(directoryId as string),
    },
  };
};

export default Edit;
