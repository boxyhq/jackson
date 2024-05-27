import { BrandingForm } from '@boxyhq/internal-ui';
import LicenseRequired from '@components/LicenseRequired';
import { errorToast, successToast } from '@components/Toaster';
import { useTranslation } from 'next-i18next';

const Branding = ({ hasValidLicense }: { hasValidLicense: boolean }) => {
  const { t } = useTranslation('common');

  if (!hasValidLicense) {
    return <LicenseRequired />;
  }

  return (
    <BrandingForm
      defaults={{ primaryColor: '#25c2a0' }}
      urls={{ getBranding: '/api/admin/branding', post: '/api/admin/branding' }}
      onUpdate={() => {
        successToast(t('settings_updated_successfully'));
      }}
      onError={(response) => {
        errorToast(response.message);
      }}
      title={t('settings_branding_title')}
      description={t('settings_branding_description')}
    />
  );
};

export default Branding;
