import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import type { NextPage } from 'next';

import LicenseRequired from '@components/LicenseRequired';

const Metadata: NextPage<any> = ({ metadata }) => {
  const { t } = useTranslation('common');

  return (
    <LicenseRequired>
      <div className='my-10 mx-5 flex h-screen justify-center'>
        <div className='rounded border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800'>
          <h2 className='mb-5 mt-5 font-bold text-gray-700 md:text-xl'>{t('saml_federation_app_info')}</h2>
          <div className='flex flex-col'>
            <div className='space-y-3'>
              <p className='text-sm leading-6 text-gray-800'>{t('saml_federation_app_info_details')}</p>
              <div className='flex flex-row gap-5'>
                <Link
                  href={`/.well-known/idp-metadata?download=true`}
                  className='btn-outline btn-secondary btn'>
                  <svg
                    className='mr-1 inline-block h-6 w-6'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                    aria-hidden
                    strokeWidth='2'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'
                    />
                  </svg>
                  {t('download_metadata')}
                </Link>
                <Link
                  href={`/.well-known/idp-metadata`}
                  className='btn-outline btn-secondary btn'
                  target='_blank'>
                  {t('metadata_url')}
                </Link>
              </div>
            </div>
            <div className='divider'>OR</div>
            <div className='space-y-6'>
              <div className='form-control w-full'>
                <label className='label'>
                  <span className='label-text font-bold'>{t('sso_url')}</span>
                </label>
                <input
                  type='text'
                  className='input-bordered input w-full'
                  defaultValue={metadata.ssoUrl}
                  readOnly
                />
              </div>
              <div className='form-control w-full'>
                <label className='label'>
                  <span className='label-text font-bold'>{t('entity_id')}</span>
                </label>
                <input
                  type='text'
                  className='input-bordered input w-full'
                  defaultValue={metadata.entityId}
                  readOnly
                />
              </div>
              <div className='form-control w-full'>
                <label className='label'>
                  <div className='flex w-full items-center justify-between'>
                    <span className='label-text font-bold'>{t('x509_certificate')}</span>
                    <span>
                      <a
                        href='/.well-known/saml.cer'
                        target='_blank'
                        className='label-text font-bold text-gray-500'>
                        {t('download')}
                      </a>
                    </span>
                  </div>
                </label>
                <textarea
                  className='textarea-bordered textarea w-full'
                  rows={10}
                  defaultValue={metadata.x509cert.trim()}
                  readOnly></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LicenseRequired>
  );
};

export default Metadata;
