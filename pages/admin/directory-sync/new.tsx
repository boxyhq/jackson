import { NextPage } from 'next';
import { Input, Button } from '@supabase/ui'
import React from 'react';
import { useRouter } from 'next/router';

const newDirectory = {
  name: '',
  tenant: '',
  product: '',
  webhook_url: '',
  webhook_secret: '',
};

const New: NextPage = () => {
  const router = useRouter();
  const [directory, setDirectory] = React.useState(newDirectory);
  const [loading, setLoading] = React.useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);

    const rawResponse = await fetch('/api/admin/directory-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(directory),
    });

    setLoading(false);

    if(!rawResponse.ok) {
      // TODO: handle error
    }

    const { data, error } = await rawResponse.json();

    if(error) {
      // TODO: handle error
    }

    if(data) {
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
        <h2 className='font-bold text-primary dark:text-white md:text-2xl'>New Configuration</h2>
      </div>
      <div className='min-w-[28rem] border rounded border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800 md:w-3/4 md:max-w-lg'>
        <form onSubmit={onSubmit}>
          <Input label='Directory name' id='name' className='mb-3' required onChange={onChange} />
          <Input label='Tenant' id='tenant' className='mb-3' required onChange={onChange} />
          <Input label='Product' id='product' className='mb-3' required onChange={onChange} />
          <Input label='Webhook URL' id='webhook_url' className='mb-3' onChange={onChange} />
          <Input label='Webhook secret' id='webhook_secret' className='mb-3' onChange={onChange} />
          <Button size='small' loading={loading}>Save Changes</Button>
        </form>
      </div>
    </div>
  );
};

export default New;