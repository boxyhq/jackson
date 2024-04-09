import LicenseRequired from '@components/LicenseRequired';
import { SecurityLogsConfigs } from 'internal-ui/src/security-logs-config';

const ConfigList = ({ hasValidLicense }: { hasValidLicense: boolean }) => {
  if (!hasValidLicense) {
    return <LicenseRequired />;
  }

  const urls = {
    getConfigs: '/api/admin/security-logs-config',
    createConfig: '/admin/settings/security-logs/new',
    editLink: (id) => `/admin/settings/security-logs/${id}`,
  };
  return <SecurityLogsConfigs urls={urls} />;
};

export default ConfigList;
