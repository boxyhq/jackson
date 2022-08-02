import RetracedEventsBrowser from 'retraced-logs-viewer';
import useSWR from 'swr';
import { fetcher } from '@lib/ui/utils';

const Viewer = ({ project, token, environment, selectedGroup }) => {
  const logRes = useSWR(
    [
      '/api/retraced/fetchlogs',
      `?project=${project}&token=${token}&environment=${environment}&group_id=${selectedGroup}`,
    ],
    fetcher,
    { revalidateOnFocus: false }
  );
  if(!logRes.data) {
    return null;
  }
  if (Object.keys(logRes.data).length === 0) {
    return (
      <div>
        <div className='rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700'>Nothing to show</div>
      </div>
    );
  }
  return (
    <div>
      { logRes.data.token && logRes.data.host && <RetracedEventsBrowser host={logRes.data.host} auditLogToken={logRes.data.token} /> }
    </div>
  );
};

export default Viewer;
