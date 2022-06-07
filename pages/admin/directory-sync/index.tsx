import type { NextPage, GetServerSideProps } from 'next';
import type { Directory } from '@lib/jackson';
import Link from 'next/link';
import jackson from '@lib/jackson';
import { PencilAltIcon, DatabaseIcon } from '@heroicons/react/outline';
import EmptyState from '@components/EmptyState';

const Index: NextPage<{ directories: Directory[] }> = ({ directories }) => {
  if(directories.length === 0) {
    return (
      <>
        <Header />
        <EmptyState
          title="No directories found"
          href="/admin/directory-sync/new"
        />
      </>
    )
  }

  return (
    <>
      <Header />
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" className="px-6 py-3">
              Name
            </th>
            <th scope="col" className="px-6 py-3">
              Tenant
            </th>
            <th scope="col" className="px-6 py-3">
              Product
            </th>
            <th scope="col" className="px-6 py-3">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {directories.map((directory) => {
            return (
              <tr key={directory.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                <td className="px-6">{directory.type} {directory.name}</td>
                <td className="px-6">{directory.tenant}</td>
                <td className="px-6">{directory.product}</td>
                <td className="px-6">
                  <div className='flex flex-row'>
                    <Link href={`/admin/directory-sync/${directory.id}`}>
                      <a className='link-primary'>
                        <DatabaseIcon className='h-5 w-5 text-secondary' />
                      </a>
                    </Link>
                    <Link href={`/admin/directory-sync/${directory.id}/edit`}>
                      <a className='link-primary'>
                        <PencilAltIcon className='h-5 w-5 text-secondary' />
                      </a>
                    </Link>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </>
  );
};

const Header = () => {
  return (
    <div className='flex items-center justify-between mb-4'>
      <h2 className='font-bold text-primary dark:text-white md:text-2xl'>Directory Sync</h2>
      <Link href="/admin/directory-sync/new">
        <a className='btn-primary'>
          + Create New
        </a>
      </Link>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const { directorySync } = await jackson();

  return {
    props: {
      directories: await directorySync.directories.list()
    },
  }
} 

export default Index;