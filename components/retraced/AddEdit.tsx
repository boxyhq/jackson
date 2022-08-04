import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClipboardCopyIcon,
  CheckIcon
} from '@heroicons/react/outline';
import { CopyToClipboard } from 'react-copy-to-clipboard';

type APIKey = {
  created: Date;
  disabled: boolean;
  environment_id: string;
  name: string;
  project_id: string;
  token: string;
};

type Environment = {
  id: string;
  name: string;
};

type Project = {
  created: number;
  environments: Environment[];
  id: string;
  name: string;
  tokens: APIKey[];
};

type NewProject = {
  project: Project;
};

const AddEdit = () => {
  const [{ status }, setSaveStatus] = useState<{ status: 'UNKNOWN' | 'SUCCESS' | 'ERROR' }>({
    status: 'UNKNOWN',
  });
  const [showAPIKeys, setShowAPIKeys] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [apiKeys, setAPIKeys] = useState<APIKey[]>([]);
  const [productname, setProductName] = useState('');
  const showCopied = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  const createNewProduct = async (event) => {
    event.preventDefault();
    const res = await fetch('/api/retraced/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: productname }),
    });
    if (res.ok) {
      const newProject: NewProject = await res.json();
      console.log(newProject.project.tokens);
      setAPIKeys(newProject.project.tokens);
      setShowAPIKeys(true);
      setSaveStatus({ status: 'SUCCESS' });
      setTimeout(() => setSaveStatus({ status: 'UNKNOWN' }), 2000);
    } else {
      // save failed
      setSaveStatus({ status: 'ERROR' });
      setTimeout(() => setSaveStatus({ status: 'UNKNOWN' }), 2000);
    }
  };

  function handleChange(event) {
    setProductName(event.target.value);
  }

  return (
    <>
      <Link href='/admin/retraced'>
        <a className='link-primary'>
          <ArrowLeftIcon aria-hidden className='h-4 w-4' />
          <span className='ml-2'>Back</span>
        </a>
      </Link>
      <div>
        <h2 className='mt-2 mb-4 text-3xl font-bold text-primary dark:text-white'>New Product</h2>
        <form onSubmit={createNewProduct}>
          <div className='m-1 min-w-[28rem] rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800 md:w-3/4 md:max-w-lg'>
            <input
              id='name'
              type='text'
              placeholder='Enter Product name here'
              value={productname}
              required={true}
              readOnly={false}
              maxLength={100}
              onChange={handleChange}
              className='block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500'
            />
            <div className='m-1 flex'>
              <button type='submit' className='btn-primary'>
                Save Changes
              </button>
              <p
                role='status'
                className={`ml-2 inline-flex items-center ${
                  status === 'SUCCESS' || status === 'ERROR' ? 'opacity-100' : 'opacity-0'
                } transition-opacity motion-reduce:transition-none`}>
                {status === 'SUCCESS' && (
                  <span className='inline-flex items-center text-primary'>
                    <CheckCircleIcon aria-hidden className='mr-1 h-5 w-5'></CheckCircleIcon>
                    Saved
                  </span>
                )}
                {status === 'ERROR' && (
                  <span className='inline-flex items-center text-red-900'>
                    <ExclamationCircleIcon aria-hidden className='mr-1 h-5 w-5'></ExclamationCircleIcon>
                    ERROR
                  </span>
                )}
              </p>
            </div>
          </div>
        </form>
      </div>
      {showAPIKeys && (
        <div className='mt-6 overflow-auto rounded-lg shadow-md'>
          <table className='min-w-full'>
            <thead className='bg-gray-50 shadow-md dark:bg-gray-700 sm:rounded-lg'>
              <tr>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-400'>
                  Product
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-400'>
                  Environment
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((token) => (
                <tr
                  key={token.environment_id}
                  className='border-b bg-white dark:border-gray-700 dark:bg-gray-800'>
                  <td className='whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white'>
                    {token.name}
                  </td>
                  <td className='whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400'>
                    {token.token}
                  </td>
                  <td>
                    <a className='link-primary cursor-pointer'>
                      <CopyToClipboard text={token.token} onCopy={showCopied}>
                        <span>
                          <ClipboardCopyIcon className='h-5 w-5 text-secondary' />
                        </span>
                      </CopyToClipboard>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="inline-flex items-center place-content-center">
          {copied && <CheckIcon className='h-5 w-5 text-secondary'>Copied</CheckIcon>}
          </div>
        </div>
      )}
    </>
  );
};

export default AddEdit;
