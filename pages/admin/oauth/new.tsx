import { ArrowLeftIcon } from '@heroicons/react/outline';
import { NextPage } from 'next';
import Link from 'next/link';

const fields = [
  {
    id: 'tenant',
    label: 'Tenant',
    required: true,
    type: 'text',
    placeholder: 'acme.com',
  },
  {
    id: 'product',
    label: 'Product',
    required: true,
    type: 'text',
    placeholder: 'demo',
  },
  {
    id: 'redirectUrls',
    label: 'Allowed redirect URLs (,Comma separated)',
    required: true,
    type: 'textarea',
    placeholder: 'http://localhost:3000',
  },
];

const NewIdP: NextPage = () => {
  const saveIdPConfig = (event) => {
    event.preventDefault();
  };

  return (
    <>
      {/* Or use router.back()  */}
      <Link href='/admin/oauth/clients'>
        <a className='inline-flex items-center px-4 py-2 mt-2 md:leading-6 text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'>
          <ArrowLeftIcon aria-hidden className='h-4 w-4 text-black dark:text-slate-50' />
          <span className='ml-2'>Back to Clients</span>
        </a>
      </Link>
      <div className='mb-4 border-b border-gray-200 dark:border-gray-700'>
        <ul className='flex flex-wrap -mb-px' id='myTab' data-tabs-toggle='#samlClients' role='tablist'>
          <li className='mr-2' role='presentation'>
            <button
              className='inline-block py-4 px-4 text-sm font-medium text-center text-gray-500 rounded-t-lg border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              id='basic-info-tab'
              data-tabs-target='#basic-info'
              type='button'
              role='tab'
              aria-controls='basic-info'
              aria-selected='false'>
              Basic information
            </button>
          </li>
          <li className='mr-2' role='presentation'>
            <button
              className='inline-block py-4 px-4 text-sm font-medium text-center text-gray-500 rounded-t-lg border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 active'
              id='settings-tab'
              data-tabs-target='#settings'
              type='button'
              role='tab'
              aria-controls='settings'
              aria-selected='true'>
              Settings
            </button>
          </li>
        </ul>
      </div>
      <div id='samlClients'>
        <div
          className='bg-gradient-to-r bg-white border border-gray-200 code-preview dark:bg-gray-800 dark:border-gray-700 p-6 rounded-xl md:w-3/4 min-w-[28rem] md:max-w-lg'
          role='tabpanel'
          id='basic-info'
          aria-labelledby='basic-info-tab'>
          <form onSubmit={saveIdPConfig}>
            {fields.map(({ id, placeholder, label, type, required }) => (
              <div className='mb-6 ' key={id}>
                <label
                  htmlFor={id}
                  className='block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300'>
                  {label}
                </label>
                {type === 'textarea' ? (
                  <textarea
                    id={id}
                    placeholder={placeholder}
                    className='block p-2 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
                    rows={3}
                  />
                ) : (
                  <input
                    id={id}
                    type={type}
                    placeholder={placeholder}
                    className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
                    required={required}
                  />
                )}
              </div>
            ))}

            <button
              type='submit'
              className='bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded leading-6 inline-block'>
              Submit
            </button>
          </form>
        </div>
        <div role='tabpanel' id='settings' aria-labelledby='settings-tab'>
          Settings
        </div>
      </div>
    </>
  );
};

export default NewIdP;
