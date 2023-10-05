const Alert = ({ type, message }: { type?: 'error' | 'success' | 'warning'; message: string }) => {
  const alertType = {
    error: 'alert-error',
    success: 'alert-success',
    warning: 'alert-warning',
  };

  const variant = type ? alertType[type] : '';

  return (
    <div className={`alert my-2 rounded ${variant}`}>
      <div className='flex gap-2'>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          className='h-6 w-6 flex-shrink-0 stroke-current'
          fill='none'
          viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
          />
        </svg>
        <span>{message}</span>
      </div>
    </div>
  );
};

export default Alert;
