import LicenseRequired from '@components/LicenseRequired';
import { SecurityLogsConfigs } from '@boxyhq/internal-ui';

const ConfigList = ({ hasValidLicense }: { hasValidLicense: boolean }) => {
  if (!hasValidLicense) {
    return <LicenseRequired />;
  }

  const urls = {
    getConfigs: '/api/admin/security-logs-config',
    createConfig: '/admin/settings/security-logs/new',
    editLink: (id) => `/admin/settings/security-logs/${id}`,
  };
  return <SecurityLogsConfigs urls={urls} skipColumns={['endpoint']} />;
};

export default ConfigList;
