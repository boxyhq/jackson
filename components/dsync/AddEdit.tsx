import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import React from 'react';
import classNames from 'classnames';

type AddEditProps = {
  providers: any;
  token?: string;
}

const AddEdit = ({ providers, token } : AddEditProps) => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [directory, setDirectory] = React.useState({
    name: '',
    tenant: '',
    product: '',
    webhook_url: '',
    webhook_secret: '',
    type: providers ? Object.keys(providers).length > 0 ? Object.keys(providers)[0] : '' : '',
  });

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);

    const rawResponse = await fetch(token ? `/api/setup/${token}/directory-sync` : '/api/admin/directory-sync', {
      method: 'POST',
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
      toast.success('Directory created successfully');
      router.replace(token ? `/setup/${token}/directory-sync/${data.id}` : `/admin/directory-sync/${data.id}`);
    }
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = event.target as HTMLInputElement;

    setDirectory({
      ...directory,
      [target.id]: target.value,
    });
  };

  return (
    <div>
      <Link href={token ? `/setup/${token}/directory-sync` : '/admin/directory-sync'}>
        <a className='btn btn-outline items-center space-x-2'>
          <ArrowLeftIcon aria-hidden className='h-4 w-4' />
          <span>{t('back')}</span>
        </a>
      </Link>
      <h2 className='mb-5 mt-5 font-bold text-gray-700 md:text-xl'>New Directory</h2>
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
              />
            </div>
            <div className='form-control w-full'>
              <label className='label'>
                <span className='label-text'>Directory provider</span>
              </label>
              <select className='select select-bordered w-full' id='type' onChange={onChange} required>
                {Object.keys(providers).map((key) => {
                  return (
                    <option key={key} value={key}>
                      {providers[key]}
                    </option>
                  );
                })}
              </select>
            </div>
            {!token && (
              <>
                <div className='form-control w-full'>
                  <label className='label'>
                    <span className='label-text'>Tenant</span>
                  </label>
                  <input
                    type='text'
                    id='tenant'
                    className='input input-bordered w-full'
                    required
                    onChange={onChange}
                  />
                </div>
                <div className='form-control w-full'>
                  <label className='label'>
                    <span className='label-text'>Product</span>
                  </label>
                  <input
                    type='text'
                    id='product'
                    className='input input-bordered w-full'
                    required
                    onChange={onChange}
                  />
                </div>
              </>
            )}
            <div className='form-control w-full'>
              <label className='label'>
                <span className='label-text'>Webhook URL</span>
              </label>
              <input
                type='text'
                id='webhook_url'
                className='input input-bordered w-full'
                onChange={onChange}
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
              />
            </div>
            <div>
              <button className={classNames('btn btn-primary', loading ? 'loading' : '')}>
                Create Directory
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEdit;
