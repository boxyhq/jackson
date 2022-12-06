import toast from 'react-hot-toast';

const Toast = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className='pointer-events-auto flex w-full max-w-md rounded bg-white shadow-lg'>
      <div className='w-0 flex-1 p-3'>
        <div className='flex items-start'>
          <div className='flex-shrink-0 pt-0.5'></div>
          <div className='ml-3 flex-1'>{children}</div>
        </div>
      </div>
      <div className='flex border-l border-gray-200'>
        <button
          onClick={() => toast.dismiss()}
          className='flex w-full items-center justify-center rounded-none rounded-r-lg border border-transparent p-4 text-sm font-medium focus:outline-none'>
          Close
        </button>
      </div>
    </div>
  );
};

export const ErrorToast = ({ message }: { message: string }) => {
  return (
    <Toast>
      <p className='text-sm font-bold text-error'>Error</p>
      <p className='mt-1 text-sm text-gray-500'>{message}</p>
    </Toast>
  );
};

export const SuccessToast = ({ message }: { message: string }) => {
  return (
    <Toast>
      <p className='text-sm font-bold text-success'>Success</p>
      <p className='mt-1 text-sm text-gray-500'>{message}</p>
    </Toast>
  );
};
