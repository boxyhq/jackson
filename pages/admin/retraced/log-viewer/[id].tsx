import { NextPage } from 'next';
import useSWR from 'swr';
import { fetcher } from '@lib/ui/utils';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic'
const Viewer = dynamic(() => import('components/retraced/viewer'), {
    ssr: false,
});
import RetracedEventsBrowser from 'retraced-logs-viewer';

const RetracedLogViewer: NextPage = () => {
  const router = useRouter();
  // const [paginate, setPaginate] = useState({ pageOffset: 0, pageLimit: 20, page: 0 });
  const id = router.query.id || "--";
  const parts = id.toString().split('-');
  const token = parts[1];
  const project = parts[2];
  const environment = parts[3];
  const groupRes = useSWR(
    ['/api/retraced/getgroups'],
    fetcher,
    { revalidateOnFocus: false }
  );
  const logRes = useSWR(
    ['/api/retraced/fetchlogs', `?project=${project}&token=${token}&environment=${environment}&group_id=dev`],
    fetcher,
    { revalidateOnFocus: false }
  );
  if (groupRes.error || logRes.error) {
    return (
      <div className='rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700'>
        {/* {error.info ? JSON.stringify(error.info) : error.status} */}
        Something went wrong!
      </div>
    );
  }

  if (!groupRes.data || !logRes.data) {
    return null;
  }

  if (Object.keys(logRes.data).length === 0) {
    return (
      <div>
        <div className='rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700'>Nothing to show</div>
      </div>
    );
  }
  console.log(logRes.data);
  return (
    <div>
      <div className='flex items-center justify-between'>
        <h2 className='font-bold text-primary dark:text-white md:text-2xl'>Audit Logs - {project}</h2>
      </div>
      { groupRes.data.length > 0 && 
      (<select className='rounded border'>
        {
          groupRes.data.map(d => <option key={d.group_id} id={d.group_id}>{d.group_id}</option>)
        }
      </select>)
      }
      <div>
        { logRes.data.token && logRes.data.host && <Viewer host={logRes.data["host"]} auditLogToken={logRes.data["token"]}  /> }
      </div>
    </div>
  );
};

export default RetracedLogViewer;
