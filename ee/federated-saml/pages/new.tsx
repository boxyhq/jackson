import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { errorToast, successToast } from '@components/Toaster';
import LicenseRequired from '@components/LicenseRequired';
import { NewFederatedSAMLApp, LinkBack } from '@boxyhq/internal-ui';

import 'react-tagsinput/react-tagsinput.css';

const NewApp = ({ hasValidLicense, samlAudience }: { hasValidLicense: boolean; samlAudience: string }) => {
  const router = useRouter();
  const { t } = useTranslation('common');

  if (!hasValidLicense) {
    return <LicenseRequired />;
  }

  return (
    <div className='space-y-4'>
      <LinkBack href='/admin/federated-saml' />
      <NewFederatedSAMLApp
        urls={{ createApp: '/api/admin/federated-saml' }}
        onSuccess={(data) => {
          successToast(t('saml_federation_new_success'));
          router.replace(`/admin/federated-saml/${data.id}/edit`);
        }}
        onError={(error) => {
          errorToast(error.message);
        }}
        onEntityIdGenerated={() => {
          successToast(t('saml_federation_entity_id_generated'));
        }}
        samlAudience={samlAudience}
      />
    </div>
  );
};

export default NewApp;
