import type { InferGetServerSidePropsType, GetServerSidePropsContext } from 'next';
import Link from 'next/link';
import jackson from '@lib/jackson';
import { PencilAltIcon, DatabaseIcon } from '@heroicons/react/outline';
import EmptyState from '@components/EmptyState';
import Paginate from '@components/Paginate';

const Index = ({
  directories,
  pageOffset,
  pageLimit,
  providers,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  return (
    <>
      <div className='mb-5 flex items-center justify-between'>
        <h2 className='font-bold text-gray-700 dark:text-white md:text-xl'>Directory Sync</h2>
        <Link href={'/admin/directory-sync/new'}>
          <a className='btn btn-primary'>+ New Directory</a>
        </Link>
      </div>
      {directories?.length === 0 && pageOffset === 0 ? (
        <EmptyState title='No directories found' href='/admin/directory-sync/new' />
      ) : (
        <div className='rounder border'>
          <table className='w-full text-left text-sm text-gray-500 dark:text-gray-400'>
            <thead className='bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400'>
              <tr>
                <th scope='col' className='px-6 py-3'>
                  Name
                </th>
                <th scope='col' className='px-6 py-3'>
                  Tenant
                </th>
                <th scope='col' className='px-6 py-3'>
                  Product
                </th>
                <th scope='col' className='px-6 py-3'>
                  Type
                </th>
                <th scope='col' className='px-6 py-3'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {directories &&
                directories.map((directory) => {
                  return (
                    <tr
                      key={directory.id}
                      className='border-b bg-white last:border-b-0 dark:border-gray-700 dark:bg-gray-800'>
                      <td className='whitespace-nowrap px-6 py-3 text-sm text-gray-500 dark:text-gray-400'>
                        {directory.name}
                      </td>
                      <td className='px-6'>{directory.tenant}</td>
                      <td className='px-6'>{directory.product}</td>
                      <td className='px-6'>{providers[directory.type]}</td>
                      <td className='px-6'>
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
                  );
                })}
            </tbody>
          </table>
          <Paginate
            pageOffset={pageOffset}
            pageLimit={pageLimit}
            itemsCount={directories ? directories.length : 0}
            path={`/admin/directory-sync?`}
          />
        </div>
      )}
    </>
  );

  // if (directories?.length === 0 && pageOffset === 0) {
  //   return (
  //     <>
  //       <Header />
  //       <EmptyState title='No directories found' href='/admin/directory-sync/new' />
  //     </>
  //   );
  // }

  // return (
  //   <>
  //     <Header />
  //     <table className='w-full rounded border text-left text-sm text-gray-500 dark:text-gray-400'>
  //       <thead className='bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400'>
  //         <tr>
  //           <th scope='col' className='px-6 py-3'>
  //             Name
  //           </th>
  //           <th scope='col' className='px-6 py-3'>
  //             Tenant
  //           </th>
  //           <th scope='col' className='px-6 py-3'>
  //             Product
  //           </th>
  //           <th scope='col' className='px-6 py-3'>
  //             Type
  //           </th>
  //           <th scope='col' className='px-6 py-3'>
  //             Actions
  //           </th>
  //         </tr>
  //       </thead>
  //       <tbody>
  //         {directories &&
  //           directories.map((directory) => {
  //             return (
  //               <tr
  //                 key={directory.id}
  //                 className='border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-600'>
  //                 <td className='px-6'>{directory.name}</td>
  //                 <td className='px-6'>{directory.tenant}</td>
  //                 <td className='px-6'>{directory.product}</td>
  //                 <td className='px-6'>{providers[directory.type]}</td>
  //                 <td className='px-6'>
  //                   <div className='flex flex-row'>
  //                     <Link href={`/admin/directory-sync/${directory.id}`}>
  //                       <a className='link-primary'>
  //                         <DatabaseIcon className='h-5 w-5 text-secondary' />
  //                       </a>
  //                     </Link>
  //                     <Link href={`/admin/directory-sync/${directory.id}/edit`}>
  //                       <a className='link-primary'>
  //                         <PencilAltIcon className='h-5 w-5 text-secondary' />
  //                       </a>
  //                     </Link>
  //                   </div>
  //                 </td>
  //               </tr>
  //             );
  //           })}
  //       </tbody>
  //     </table>
  //     <Paginate
  //       pageOffset={pageOffset}
  //       pageLimit={pageLimit}
  //       itemsCount={directories ? directories.length : 0}
  //       path={`/admin/directory-sync?`}
  //     />
  //   </>
  // );
};

// const Header = () => {
//   return (
//     <div className='mb-4 flex items-center justify-between'>
//       <h2 className='font-bold text-primary dark:text-white md:text-2xl'>Directory Sync</h2>
//       <Link href='/admin/directory-sync/new'>
//         <a className='btn-primary'>+ Create New</a>
//       </Link>
//     </div>
//   );
// };

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const { offset = 0 } = context.query;
  const { directorySyncController } = await jackson();

  const pageOffset = parseInt(offset as string);
  const pageLimit = 25;
  const { data: directories } = await directorySyncController.directories.list({ pageOffset, pageLimit });

  return {
    props: {
      providers: directorySyncController.providers(),
      directories,
      pageOffset,
      pageLimit,
    },
  };
};

export default Index;
