import { NextPage, GetServerSideProps } from 'next';
import { Input, Button } from '@supabase/ui'
import React from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import jackson from '@lib/jackson';

const Edit: NextPage = (props: any) => {
  const { id, name, webhook, } = props.directory;

  const router = useRouter();
  const [directory, setDirectory] = React.useState({ 
    name,
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

    if(error) {
      toast.error(error.message);
      return;
    }

    if(data) {
      toast.success('Directory updated successfully');
      router.replace('/admin/directory-sync');
    }
  }

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const target = event.target as HTMLInputElement;

    setDirectory({
      ...directory,
      [target.id]: target.value,
    });
  }

  return (
    <div>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='font-bold text-primary dark:text-white md:text-2xl'>Update Configuration</h2>
      </div>
      <div className='min-w-[28rem] border rounded border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800 md:w-3/4 md:max-w-lg'>
        <form onSubmit={onSubmit}>
          <Input label='Directory name' id='name' value={directory.name} className='mb-3' required onChange={onChange} />
          <Input label='Webhook URL' id='webhook_url' value={directory.webhook_url} className='mb-3' required onChange={onChange} />
          <Input label='Webhook secret' id='webhook_secret' className='mb-3' value={directory.webhook_secret} required onChange={onChange} />
          <Button size='small' loading={loading}>Save Changes</Button>
        </form>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { directoryId } = context.query;
  const { directorySync } = await jackson();

  const directory = await directorySync.directories.get(directoryId as string);

  return {
    props: {
      directory,
    },
  }
}

export default Edit;