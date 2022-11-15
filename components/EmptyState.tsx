import Link from 'next/link';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'next-i18next';

const EmptyState = ({ title, href, className }: { title: string; href?: string; className?: string }) => {
  const { t } = useTranslation('common');
  return (
    <div
      className={`my-3 flex flex-col items-center justify-center space-y-3 rounded border py-32 ${className}`}>
      <InformationCircleIcon className='h-10 w-10' />
      <h4 className='text-center'>{title}</h4>
      {href && (
        <Link href={href} className='btn-primary btn'>
          + {t('create_new')}
        </Link>
      )}
    </div>
  );
};

export default EmptyState;
