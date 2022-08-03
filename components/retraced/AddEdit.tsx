import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeftIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/outline';

const AddEdit = () => {
  const [{ status }, setSaveStatus] = useState<{ status: 'UNKNOWN' | 'SUCCESS' | 'ERROR' }>({
    status: 'UNKNOWN',
  });
  const [productname, setProductName] = useState('');
  const createNewProduct = async (event) => {
    event.preventDefault();
    const res = await fetch('/api/retraced/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({name: productname}),
    });
    if (res.ok) {
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
          <div className='min-w-[28rem] rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800 md:w-3/4 md:max-w-lg m-1'>
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
            <div className='flex m-1'>
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
    </>
  );
};

export default AddEdit;
