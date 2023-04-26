import dynamic from 'next/dynamic';

import LicenseRequired from '@components/LicenseRequired';

interface RetracedEventsBrowserProps {
  host: string;
  header: string;
  auditLogToken: string;
}

interface AuditLogProps {
  viewerToken: string;
  retracedHostUrl: string;
}

const RetracedEventsBrowser = dynamic<RetracedEventsBrowserProps>(() => import('@retracedhq/logs-viewer'), {
  ssr: false,
});

const AuditLog = (props: AuditLogProps) => {
  const { viewerToken, retracedHostUrl } = props;

  return (
    <LicenseRequired>
      <RetracedEventsBrowser
        host={`${retracedHostUrl}/viewer/v1`}
        auditLogToken={viewerToken}
        header='Audit Logs'
      />
    </LicenseRequired>
  );
};

export default AuditLog;
