import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { LinkBack } from '@components/LinkBack';
import { errorToast, successToast } from '@components/Toaster';
import LicenseRequired from '@components/LicenseRequired';
import { NewFederatedSAMLApp, PageLayout } from '@boxyhq/internal-ui';

import 'react-tagsinput/react-tagsinput.css';

// TODO:
// Add toasts for success and error, entity id generation

const NewApp = ({ hasValidLicense, samlAudience }: { hasValidLicense: boolean; samlAudience: string }) => {
  const router = useRouter();
  const { t } = useTranslation('common');

  if (!hasValidLicense) {
    return <LicenseRequired />;
  }

  return (
    <>
      <LinkBack href='/admin/federated-saml' />
      <PageLayout title={t('saml_federation_add_new_app')}>
        <NewFederatedSAMLApp
          urls={{ post: '/api/admin/federated-saml' }}
          onSuccess={(data) => router.replace(`/admin/federated-saml/${data.id}/edit`)}
          onError={(error) => errorToast(error.message)}
          samlAudience={samlAudience}
        />
      </PageLayout>
    </>
  );
};

export default NewApp;
