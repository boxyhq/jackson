import useSWR from 'swr';
import Link from 'next/link';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import type { SAMLFederationAppWithMetadata } from '@boxyhq/saml-jackson';
import { useTranslation } from 'next-i18next';

import Alert from '@components/Alert';
import { fetcher } from '@lib/ui/utils';
import Loading from '@components/Loading';
import type { ApiError, ApiSuccess } from 'types';
import LicenseRequired from '@components/LicenseRequired';

const Metadata: NextPage = () => {
  const { t } = useTranslation('common');
  const router = useRouter();

  const { id } = router.query;

  const { data, error } = useSWR<ApiSuccess<SAMLFederationAppWithMetadata>, ApiError>(
    `/api/admin/federated-saml/${id}`,
    fetcher
  );

  if (error) {
    return <Alert type='error' message={error.message} />;
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
          <div className='space-y-3'>
            <div className='form-control w-full'>
              <label className='label'>
                <span className='label-text'>{t('sso_url')}</span>
              </label>
              <input type='text' className='input-bordered input w-full' defaultValue={app.metadata.ssoUrl} />
            </div>
            <div className='form-control w-full'>
              <label className='label'>
                <span className='label-text'>{t('entity_id')}</span>
              </label>
              <input
                type='text'
                className='input-bordered input w-full'
                defaultValue={app.metadata.entityId}
              />
            </div>
            <div className='form-control w-full'>
              <label className='label'>
                <span className='label-text'>{t('x509_certificate')}</span>
              </label>
              <textarea
                className='textarea-bordered textarea w-full'
                rows={5}
                defaultValue={app.metadata.x509cert}></textarea>
            </div>
          </div>
        </div>
      </div>
    </LicenseRequired>
  );
};

export default Metadata;
