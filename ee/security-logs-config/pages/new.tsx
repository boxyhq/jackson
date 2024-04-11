import { successToast, errorToast } from '@components/Toaster';
import LicenseRequired from '@components/LicenseRequired';
import { SecurityLogsConfigCreate } from '@boxyhq/internal-ui';

const NewConfiguration = ({ hasValidLicense }: { hasValidLicense: boolean }) => {
  if (!hasValidLicense) {
    return <LicenseRequired />;
  }

  const urls = {
    createConfig: '/api/admin/security-logs-config',
    listConfigs: '/admin/settings/security-logs',
  };

  return <SecurityLogsConfigCreate urls={urls} onSuccess={successToast} onError={errorToast} />;
};

export default NewConfiguration;
