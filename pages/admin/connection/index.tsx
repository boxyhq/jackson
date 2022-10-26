import type { NextPage } from 'next';
import Link from 'next/link';
import { LinkIcon, PlusIcon } from '@heroicons/react/24/outline';
import ConnectionList from '@components/connection/ConnectionList';

const Connections: NextPage = () => {
  return (
    <div>
      <div className='mb-5 flex items-center justify-between'>
        <h2 className='font-bold text-gray-700 dark:text-white md:text-xl'>Connections</h2>
        <div>
          <Link href={`/admin/connection/new`}>
            <a className='btn btn-primary m-2' data-test-id='create-connection'>
              <PlusIcon className='mr-1 h-5 w-5' /> New Connection
            </a>
          </Link>
          <Link href={`/admin/setup-link/new?service=Jackson`}>
            <a className='btn btn-primary m-2' data-test-id='create-setup-link'>
              <LinkIcon className='mr-1 h-5 w-5' /> New Setup Link
            </a>
          </Link>
        </div>
      </div>
      <ConnectionList />
    </div>
  );
};

export default Connections;
