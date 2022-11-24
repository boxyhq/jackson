import type { NextPage } from 'next';
import type { SAMLFederationApp } from '@boxyhq/saml-jackson';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import classNames from 'classnames';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import useSWR from 'swr';

import { fetcher } from '@lib/ui/utils';
import { ApiSuccess, ApiError, ApiResponse } from 'types';
import Loading from '@components/Loading';
import Alert from '@components/Alert';

const initialValue = {
  name: '',
  acsUrl: '',
  entityId: '',
};

const UpdateApp: NextPage = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [existingApp, setApp] = useState<typeof initialValue>(initialValue);

  const { id } = router.query as { id: string };

  const { data, error } = useSWR<ApiSuccess<SAMLFederationApp>, ApiError>(
    `/api/admin/federated-saml/${id}`,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  useEffect(() => {
    if (data) {
      setApp(data.data);
    }
  }, [data]);

  if (error) {
    return <Alert type='error' message={error.message}></Alert>;
  }

  if (!data) {
    return <Loading />;
  }

  const app = data.data;

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);

    const response = await fetch(`/api/admin/federated-saml/${app.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(existingApp),
    });

    setLoading(false);

    const { error }: ApiResponse<SAMLFederationApp> = await response.json();

    if (!response.ok) {
      toast.error(error.message);
    } else {
      toast.success('SAML federation app updated successfully');
    }
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = event.target as HTMLInputElement;

    setApp({
      ...existingApp,
      [target.id]: target.value,
    });
  };

  return (
    <div>
      <Link href='/admin/federated-saml' className='btn-outline btn items-center space-x-2'>
        <ArrowLeftIcon aria-hidden className='h-4 w-4' />
        <span>{t('back')}</span>
      </Link>
      <h2 className='mb-5 mt-5 font-bold text-gray-700 md:text-xl'>Update SAML Federation App</h2>
      <div className='rounded border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800'>
        <form onSubmit={onSubmit}>
          <div className='flex flex-col space-y-3'>
            <div className='form-control w-full md:w-1/2'>
              <label className='label'>
                <span className='label-text'>Tenant</span>
              </label>
              <input type='text' className='input-bordered input w-full' defaultValue={app.tenant} disabled />
            </div>
            <div className='form-control w-full md:w-1/2'>
              <label className='label'>
                <span className='label-text'>Product</span>
              </label>
              <input
                type='text'
                className='input-bordered input w-full'
                defaultValue={app.product}
                disabled
              />
            </div>
            <div className='form-control w-full md:w-1/2'>
              <label className='label'>
                <span className='label-text'>App Name</span>
              </label>
              <input
                type='text'
                id='name'
                className='input-bordered input w-full'
                required
                onChange={onChange}
                value={existingApp.name}
              />
            </div>
            <div className='form-control w-full md:w-1/2'>
              <label className='label'>
                <span className='label-text'>ACS URL</span>
              </label>
              <input
                type='url'
                id='acsUrl'
                className='input-bordered input w-full'
                required
                onChange={onChange}
                value={existingApp.acsUrl}
              />
            </div>
            <div className='form-control w-full md:w-1/2'>
              <label className='label'>
                <span className='label-text'>Entity ID</span>
              </label>
              <input
                type='url'
                id='entityId'
                className='input-bordered input w-full'
                required
                onChange={onChange}
                value={existingApp.entityId}
              />
            </div>
            <div>
              <button className={classNames('btn-primary btn', loading ? 'loading' : '')}>
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateApp;
