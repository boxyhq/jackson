import LicenseRequired from '@components/LicenseRequired';
import { errorToast, successToast } from '@components/Toaster';
import { SecurityLogsConfigs } from '@boxyhq/internal-ui';

const ConfigList = ({ hasValidLicense }: { hasValidLicense: boolean }) => {
  if (!hasValidLicense) {
    return <LicenseRequired />;
  }

  const urls = {
    getConfigs: '/api/admin/security-logs-config',
    createConfig: '/admin/settings/security-logs/new',
    editLink: (id) => `/admin/settings/security-logs/${id}`,
    deleteConfig: (id: string) => `/api/admin/security-logs-config/${id}`,
  };
  return (
    <SecurityLogsConfigs
      urls={urls}
      skipColumns={['endpoint']}
      onSuccess={successToast}
      onError={errorToast}
    />
  );
};

export default ConfigList;
