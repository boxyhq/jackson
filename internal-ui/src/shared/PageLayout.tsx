// TODO: Fix the actions prop type

export const PageLayout = ({
  title,
  description,
  children,
  actions,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: any;
  className?: string;
}) => {
  return (
    <>
      <div className={`flex flex-col my-2 ${className}`}>
        <div className='flex justify-between items-center h-10'>
          <h2 className='text-emphasis text-xl font-semibold leading-5 tracking-wide'>{title}</h2>
          {actions && <div className='flex gap-4'>{actions}</div>}
        </div>
        {description && <div className='text-gray-700 dark:text-white'>{description}</div>}
      </div>
      <main className='py-4'>{children}</main>
    </>
  );
};
