import { errorToast, successToast } from '@components/Toaster';
import { useRouter } from 'next/router';
import LicenseRequired from '@components/LicenseRequired';
import { SecurityLogsConfigEdit } from '@boxyhq/internal-ui';

const UpdateConfig = ({ hasValidLicense }: { hasValidLicense: boolean }) => {
  const router = useRouter();
  const { id } = router.query as { id: string };

  if (!hasValidLicense) {
    return <LicenseRequired />;
  }

  const urls = {
    getById: (id: string) => `/api/admin/security-logs-config/${id}`,
    updateById: (id: string) => `/api/admin/security-logs-config/${id}`,
    deleteById: (id: string) => `/api/admin/security-logs-config/${id}`,
    listConfigs: '/admin/settings/security-logs',
  };

  return (
    <>
      <SecurityLogsConfigEdit id={id} urls={urls} onSuccess={successToast} onError={errorToast} />
    </>
  );
};

export default UpdateConfig;
