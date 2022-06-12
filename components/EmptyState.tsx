import { Typography } from '@supabase/ui';
import Link from 'next/link';
import { InformationCircleIcon } from '@heroicons/react/outline';

const EmptyState = ({ title, href }: { title: string; href?: string }) => {
  return (
    <div className='flex w-3/4 flex-col items-center justify-center space-y-3 rounded border py-40'>
      <InformationCircleIcon className='h-10 w-10' />
      <Typography.Title level={4} className='text-center'>
        {title}
      </Typography.Title>
      {href && (
        <Link href={href}>
          <a className='btn-primary'>+ Create New</a>
        </Link>
      )}
    </div>
  );
};

export default EmptyState;
