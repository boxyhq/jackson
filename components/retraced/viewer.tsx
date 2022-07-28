import RetracedEventsBrowser from 'retraced-logs-viewer';

const Viewer = ({ host, auditLogToken }) => {
  return <RetracedEventsBrowser host={host} auditLogToken={auditLogToken} />;
};

export default Viewer;
