import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { errorToast, successToast } from '@components/Toaster';
import LicenseRequired from '@components/LicenseRequired';
import { EditFederatedSAMLApp, LinkBack } from '@boxyhq/internal-ui';

import 'react-tagsinput/react-tagsinput.css';

const UpdateApp = ({ hasValidLicense }: { hasValidLicense: boolean }) => {
  const router = useRouter();
  const { t } = useTranslation('common');

  const { id } = router.query as { id: string };

  if (!hasValidLicense) {
    return <LicenseRequired />;
  }

  return (
    <div className='space-y-4'>
      <LinkBack href='/admin/federated-saml' />
      <EditFederatedSAMLApp
        urls={{
          getApp: `/api/admin/federated-saml/${id}`,
          updateApp: `/api/admin/federated-saml/${id}`,
          deleteApp: `/api/admin/federated-saml/${id}`,
        }}
        onUpdate={() => {
          successToast(t('saml_federation_update_success'));
        }}
        onDelete={() => {
          successToast(t('saml_federation_delete_success'));
          router.push('/admin/federated-saml');
        }}
        onError={(error) => {
          errorToast(error.message);
        }}
      />
    </div>
  );
};

export default UpdateApp;
