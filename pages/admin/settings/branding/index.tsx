import type { GetServerSidePropsContext, NextPage } from 'next';
import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { LinkBack } from '@components/LinkBack';
import { ButtonPrimary } from '@components/ButtonPrimary';
import { errorToast, successToast } from '@components/Toaster';
import type { ApiResponse } from 'types';
import type { AdminPortalSettings } from '@boxyhq/saml-jackson';

type Branding = AdminPortalSettings['branding'];

const Branding: NextPage = () => {
  const { t } = useTranslation('common');
  const [loading, setLoading] = useState(false);
  const [branding, setBranding] = useState<Branding>({
    logoUrl: null,
    pageTitle: null,
    primaryColor: null,
  });

  // Fetch settings
  const fetchSettings = async () => {
    const rawResponse = await fetch('/api/admin/settings', {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response: ApiResponse<{ branding: Branding }> = await rawResponse.json();

    if ('data' in response) {
      setBranding(response.data.branding);
    }
  };

  // Update settings
  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);

    const rawResponse = await fetch('/api/admin/settings', {
      method: 'POST',
      body: JSON.stringify({ branding }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    setLoading(false);

    const response: ApiResponse<Branding> = await rawResponse.json();

    if ('error' in response) {
      errorToast(response.error.message);
      return;
    }

    if ('data' in response) {
      successToast('Branding settings have been updated.');
    }
  };

  // Handle input change
  const onChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = event.target as HTMLInputElement;

    setBranding({
      ...branding,
      [target.id]: target.value,
    });
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <>
      <LinkBack href='/admin/federated-saml' />
      <h2 className='mt-5 font-bold text-gray-700 md:text-xl'>Branding</h2>
      <p className='py-3 text-base leading-6 text-gray-800'>
        Customize the look and feel of your portal. You can change the logo, page title and primary color.
        These values will be used in the Setup Links pages.
      </p>
      <div className='rounded border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800'>
        <form onSubmit={onSubmit}>
          <div className='flex flex-col space-y-3'>
            <div className='form-control w-full md:w-1/2'>
              <label className='label'>
                <span className='label-text'>
                  Logo URL <span className='text-gray-400'>( URL to a PNG or SVG image )</span>
                </span>
              </label>
              <input
                type='url'
                id='logoUrl'
                className='input-bordered input'
                onChange={onChange}
                placeholder='Logo URL'
                value={branding.logoUrl || ''}
              />
            </div>
            <div className='form-control w-full md:w-1/2'>
              <label className='label'>
                <span className='label-text'>
                  Page Title <span className='text-gray-400'>( It will be used as browser tab title )</span>
                </span>
              </label>
              <input
                type='text'
                id='pageTitle'
                className='input-bordered input'
                onChange={onChange}
                placeholder='ACME Portal'
                value={branding.pageTitle || ''}
              />
            </div>
            <div className='form-control w-full md:w-1/2'>
              <label className='label'>
                <span className='label-text'>
                  Primary color{' '}
                  <span className='text-gray-400'>( It will be used for the buttons, links, etc. )</span>
                </span>
              </label>
              <input
                type='color'
                id='primaryColor'
                className='input-bordered input'
                onChange={onChange}
                value={branding.primaryColor || ''}
              />
            </div>
            <div>
              <ButtonPrimary loading={loading}>Save Changes</ButtonPrimary>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export async function getStaticProps({ locale }: GetServerSidePropsContext) {
  return {
    props: {
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
}

export default Branding;
