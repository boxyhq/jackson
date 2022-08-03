import Link from 'next/link';
import { InformationCircleIcon } from '@heroicons/react/outline';

const EmptyState = ({ title, href }: { title: string; href?: string }) => {
  return (
    <div className='flex flex-col items-center justify-center space-y-3 rounded border py-32'>
      <InformationCircleIcon className='h-10 w-10' />
      <h4 className='text-center'>{title}</h4>
      {href && (
        <Link href={href}>
          <a className='btn-primary'>+ Create New</a>
        </Link>
      )}
    </div>
  );
};

export default EmptyState;
