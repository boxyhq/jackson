import dynamic from 'next/dynamic';
import useSWR from 'swr';

import LicenseRequired from '@components/LicenseRequired';
import Alert from '@components/Alert';
import Loading from '@components/Loading';
import { fetcher } from '@lib/ui/utils';
import type { ApiError } from 'types';

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

const AuditLog = () => {
  const { data, error, isLoading } = useSWR<AuditLogProps, ApiError>('/api/admin/audit-log', fetcher, {
    revalidateOnFocus: false,
  });

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return (
      <LicenseRequired>
        <Alert message={error.message} type='error' />
      </LicenseRequired>
    );
  }

  if (!data) {
    return null;
  }

  const { viewerToken, retracedHostUrl } = data;

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
