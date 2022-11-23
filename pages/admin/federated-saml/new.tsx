import type { NextPage, GetServerSideProps } from 'next';
import type { SAMLFederationApp } from '@boxyhq/saml-jackson';
import React from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import classNames from 'classnames';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

type ApiResponse<T> = {
  data: T | null;
  error?: {
    message: string;
  } | null;
};

const NewApp: NextPage = () => {
  const router = useRouter();
  const { t } = useTranslation('common');
  const [loading, setLoading] = React.useState(false);
  const [newApp, setApp] = React.useState({
    tenant: '',
    product: '',
    acsUrl: '',
    entityId: '',
  });

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);

    const response = await fetch('/api/admin/federated-saml', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newApp),
    });

    setLoading(false);

    const { data, error }: ApiResponse<SAMLFederationApp> = await response.json();

    if (!response.ok) {
      toast.error(error?.message || 'Something went wrong');
      return;
    }

    const app = data;

    router.replace(`/admin/federated-saml/${app?.id}/metadata`);
    toast.success('SAML federation app created successfully');
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = event.target as HTMLInputElement;

    setApp({
      ...newApp,
      [target.id]: target.value,
    });
  };

  return (
    <div>
      <Link href='/admin/federated-saml' className='btn-outline btn items-center space-x-2'>
        <ArrowLeftIcon aria-hidden className='h-4 w-4' />
        <span>{t('back')}</span>
      </Link>
      <h2 className='mb-5 mt-5 font-bold text-gray-700 md:text-xl'>Add SAML Federation App</h2>
      <div className='rounded border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800'>
        <form onSubmit={onSubmit}>
          <div className='flex flex-col space-y-3'>
            <p className='text-sm leading-6 text-gray-800'>
              To configure SAML Federation app, add service provider details such as ACS URL and Entity ID.
              You can find the details from your service provider portal or from the documentation.
            </p>
            <div className='form-control w-full md:w-1/2'>
              <label className='label'>
                <span className='label-text'>Tenant</span>
              </label>
              <input
                type='text'
                id='tenant'
                className='input-bordered input w-full'
                required
                onChange={onChange}
              />
            </div>
            <div className='form-control w-full md:w-1/2'>
              <label className='label'>
                <span className='label-text'>Product</span>
              </label>
              <input
                type='text'
                id='product'
                className='input-bordered input w-full'
                required
                onChange={onChange}
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
              />
            </div>
            <div>
              <button className={classNames('btn-primary btn', loading ? 'loading' : '')}>Create App</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? '', ['common'])),
    },
  };
};

export default NewApp;
