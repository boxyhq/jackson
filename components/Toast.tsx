import toast from 'react-hot-toast';

type ErrorToastProps = {
  message: string;
};

export const ErrorToast = ({ message }: ErrorToastProps) => {
  return (
    <div className={`pointer-events-auto flex w-full max-w-md rounded border bg-white shadow-lg`}>
      <div className='w-0 flex-1 p-3'>
        <div className='flex items-start'>
          <div className='flex-shrink-0 pt-0.5'></div>
          <div className='ml-3 flex-1'>
            <p className='text-sm font-bold text-error '>Error</p>
            <p className='mt-1 text-sm text-gray-500'>{message}</p>
          </div>
        </div>
      </div>
      <div className='flex border-l border-gray-200'>
        <button
          onClick={() => toast.dismiss()}
          className='flex w-full items-center justify-center rounded-none rounded-r-lg border border-transparent p-4 text-sm font-medium text-primary focus:outline-none'>
          Close
        </button>
      </div>
    </div>
  );
};
