import type { NextPage } from 'next';
import useSWR from 'swr';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import RetracedEventsBrowser from 'retraced-logs-viewer';

import { fetcher } from '@lib/ui/utils';

const Viewer = dynamic(() => import('components/retraced/viewer'), {
  ssr: false,
});

const Events: NextPage = () => {
  const router = useRouter();

  const { id: projectId } = router.query;

  const token = 'd3822aab24d040ae82ef8194f8a017c1';
  const environment = 'e7f82b1eb14441fb82469a4a0104f9e5';

  const [selectedGroup, setSelectedGroup] = useState('dev');

  const groupRes = useSWR(
    [`/api/retraced/projects/${projectId}/groups`, `?environmentId=${environment}`],
    fetcher,
    { revalidateOnFocus: false }
  );

  if (groupRes.error) {
    return (
      <div className='rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700'>
        {/* {error.info ? JSON.stringify(error.info) : error.status} */}
        Something went wrong!
      </div>
    );
  }

  if (!groupRes.data) {
    return null;
  }

  return (
    <>
      <RetracedEventsBrowser
        host='http://localhost:3000/auditlog'
        auditLogToken={token}
        mount={true}
        customClass={'text-primary dark:text-white'}
      />
      {/* <Viewer project={projectId} token={token} environment={environment} selectedGroup={selectedGroup} /> */}
    </>
  );

  return (
    <>
      <div>
        <div className='flex flex-row items-center justify-between'>
          <div className='flex basis-1/2'>
            <h2 className='font-bold text-primary dark:text-white md:text-2xl'>Audit Logs</h2>
          </div>
          <div className='basis-1/7'>
            {groupRes.data.length > 0 && (
              <div className='flex flex-row'>
                <div className=''>
                  <label htmlFor='tenant' className='text-primary'>
                    Select Tenant
                  </label>
                  <select
                    id='tenant'
                    className='block w-full rounded rounded-lg border border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500'
                    onChange={(e) => {
                      setSelectedGroup(e.target.value);
                    }}
                    value={selectedGroup}>
                    <option key='' id=''></option>
                    {groupRes.data.map((d) => (
                      <option key={d.group_id} id={d.group_id}>
                        {d.group_id}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className='items-center justify-between'>
        {selectedGroup && (
          <Viewer project={projectId} token={token} environment={environment} selectedGroup={selectedGroup} />
        )}
      </div>
    </>
  );
};

export default Events;
