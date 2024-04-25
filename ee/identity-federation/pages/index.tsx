import router from 'next/router';
import LicenseRequired from '@components/LicenseRequired';
import { FederatedSAMLApps } from '@boxyhq/internal-ui';

const AppsList = ({ hasValidLicense }: { hasValidLicense: boolean }) => {
  if (!hasValidLicense) {
    return <LicenseRequired />;
  }

  return (
    <FederatedSAMLApps
      urls={{ getApps: '/api/admin/identity-federation' }}
      onEdit={(app) => router.push(`/admin/identity-federation/${app.id}/edit`)}
      actions={{
        newApp: '/admin/identity-federation/new',
        samlConfiguration: '/.well-known/idp-configuration',
        oidcConfiguration: '/.well-known/openid-configuration',
      }}
    />
  );
};

export default AppsList;
