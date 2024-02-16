import router from 'next/router';
import { useTranslation } from 'next-i18next';
import { LinkPrimary } from '@components/LinkPrimary';
import { LinkOutline } from '@components/LinkOutline';
import LicenseRequired from '@components/LicenseRequired';
import { FederatedSAMLApps, PageLayout } from '@boxyhq/internal-ui';

// TODO:
// Test pagination with DynamoDB
// Test pagination
// Remove unused translations keys from `common.json`

const AppsList = ({ hasValidLicense }: { hasValidLicense: boolean }) => {
  const { t } = useTranslation('common');

  if (!hasValidLicense) {
    return <LicenseRequired />;
  }

  return (
    <PageLayout
      title={t('saml_federation_apps')}
      actions={
        <>
          <LinkOutline href={'/.well-known/idp-configuration'} target='_blank'>
            {t('idp_configuration')}
          </LinkOutline>
          <LinkPrimary href='/admin/federated-saml/new'>{t('new_saml_federation_app')}</LinkPrimary>
        </>
      }>
      <FederatedSAMLApps
        urls={{ get: '/api/admin/federated-saml' }}
        onEdit={(app) => router.push(`/admin/federated-saml/${app.id}/edit`)}
      />
    </PageLayout>
  );
};

export default AppsList;
