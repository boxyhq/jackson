import router from 'next/router';
import LicenseRequired from '@components/LicenseRequired';
import { FederatedSAMLApps } from '@boxyhq/internal-ui';

const AppsList = ({ hasValidLicense }: { hasValidLicense: boolean }) => {
  if (!hasValidLicense) {
    return <LicenseRequired />;
  }

  return (
    <FederatedSAMLApps
      urls={{ get: '/api/admin/federated-saml' }}
      onEdit={(app) => router.push(`/admin/federated-saml/${app.id}/edit`)}
      actions={{ newApp: '/admin/federated-saml/new', idpConfiguration: '/.well-known/idp-configuration' }}
    />
  );
};

export default AppsList;
