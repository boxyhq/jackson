import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { errorToast } from '@components/Toaster';
import { LinkBack } from '@components/LinkBack';
import { LinkOutline } from '@components/LinkOutline';
import LicenseRequired from '@components/LicenseRequired';
import { EditFederatedSAMLApp, PageLayout } from '@boxyhq/internal-ui';

import 'react-tagsinput/react-tagsinput.css';

// TODO:
// Add toasts for success and error
// Add delete button

const UpdateApp = ({ hasValidLicense }: { hasValidLicense: boolean }) => {
  const router = useRouter();
  const { t } = useTranslation('common');

  const { id } = router.query as { id: string };

  if (!hasValidLicense) {
    return <LicenseRequired />;
  }

  return (
    <>
      <LinkBack href='/admin/federated-saml' />
      <PageLayout
        title={t('saml_federation_add_new_app')}
        actions={
          <>
            <LinkOutline href={'/.well-known/idp-configuration'} target='_blank'>
              {t('idp_configuration')}
            </LinkOutline>
          </>
        }>
        <EditFederatedSAMLApp
          urls={{
            patch: `/api/admin/federated-saml/${id}`,
            get: `/api/admin/federated-saml/${id}`,
            delete: `/api/admin/federated-saml/${id}`,
          }}
          onUpdate={() => {}}
          onDelete={() => router.push('/admin/federated-saml')}
          onError={(error) => errorToast(error.message)}
        />
      </PageLayout>
    </>
  );
};

export default UpdateApp;
