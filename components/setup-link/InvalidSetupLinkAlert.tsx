const InvalidSetupLinkAlert = ({ message }: { message: string }) => {
  return (
    <div className='flex flex-col gap-3 rounded border border-error p-4'>
      <h3 className='text-base font-medium'>{message}</h3>
      <p className='leading-6'>
        Please contact your administrator to get a new setup link. If you are the administrator, visit the
        Admin Portal to create a new setup link for the service.
      </p>
    </div>
  );
};

export default InvalidSetupLinkAlert;
