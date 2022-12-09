import useSWR from 'swr';
import Link from 'next/link';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import type { SAMLFederationAppWithMetadata } from '@boxyhq/saml-jackson';

import { fetcher } from '@lib/ui/utils';
import Loading from '@components/Loading';
import { errorToast } from '@components/Toast';
import type { ApiError, ApiSuccess } from 'types';
import LicenseRequired from '@components/LicenseRequired';

const Metadata: NextPage = () => {
  const { t } = useTranslation('common');
  const router = useRouter();

  const { id } = router.query as { id: string };

  const { data, error } = useSWR<ApiSuccess<SAMLFederationAppWithMetadata>, ApiError>(
    `/api/admin/federated-saml/${id}`,
    fetcher
  );

  if (error) {
    errorToast(error.message);
    return null;
  }

  if (!data) {
    return <Loading />;
  }

  const app = data.data;

  return (
    <LicenseRequired>
      <h2 className='mb-5 mt-5 font-bold text-gray-700 md:text-xl'>{t('saml_federation_app_info')}</h2>
      <div className='rounded border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800'>
        <div className='flex flex-col'>
          <div className='space-y-3'>
            <p className='text-sm leading-6 text-gray-800'>{t('saml_federation_app_info_details')}</p>
            <div className='flex flex-row gap-5'>
              <button className='btn-outline btn-secondary btn'>{t('download_metadata')}</button>
              <Link
                href={`/api/federated-saml/${id}/metadata`}
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
                defaultValue={app.metadata.ssoUrl}
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
                defaultValue={app.metadata.entityId}
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
                defaultValue={app.metadata.x509cert}
                readOnly></textarea>
            </div>
          </div>
        </div>
      </div>
    </LicenseRequired>
  );
};

export default Metadata;
