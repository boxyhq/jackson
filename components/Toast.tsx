import toast from 'react-hot-toast';
import { useTranslation } from 'next-i18next';

const Toast = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className='pointer-events-auto flex w-full max-w-md rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-10'>
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
  const { t } = useTranslation('common');

  return (
    <Toast>
      <p className='text-sm font-bold text-error'>{t('error')}</p>
      <p className='mt-1 text-sm text-gray-500'>{message}</p>
    </Toast>
  );
};

export const SuccessToast = ({ message }: { message: string }) => {
  const { t } = useTranslation('common');

  return (
    <Toast>
      <p className='text-sm font-bold text-success'>{t('success')}</p>
      <p className='mt-1 text-sm text-gray-500'>{message}</p>
    </Toast>
  );
};
