import { useTranslation } from 'next-i18next';
import { successToast } from '@components/Toaster';
import LicenseRequired from '@components/LicenseRequired';
import { SecurityLogsConfigCreate } from 'internal-ui/src/security-logs-config';

const NewConfiguration = ({ hasValidLicense }: { hasValidLicense: boolean }) => {
  const { t } = useTranslation('common');

  if (!hasValidLicense) {
    return <LicenseRequired />;
  }

  const urls = {
    createConfig: '/api/admin/security-logs-config',
    listConfigs: '/admin/settings/security-logs',
  };

  return <SecurityLogsConfigCreate urls={urls} onSuccess={successToast} />;
};

export default NewConfiguration;
