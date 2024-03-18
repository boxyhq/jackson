import router from 'next/router';
import LicenseRequired from '@components/LicenseRequired';
import { FederatedSAMLApps } from '@boxyhq/internal-ui';

const AppsList = ({ hasValidLicense }: { hasValidLicense: boolean }) => {
  if (!hasValidLicense) {
    return <LicenseRequired />;
  }

  return (
    <FederatedSAMLApps
      urls={{ getApps: '/api/admin/federated-saml' }}
      onEdit={(app) => router.push(`/admin/federated-saml/${app.id}/edit`)}
      actions={{
        newApp: '/admin/federated-saml/new',
        samlConfiguration: '/.well-known/idp-configuration',
        oidcConfiguration: '/.well-known/openid-configuration',
      }}
    />
  );
};

export default AppsList;
