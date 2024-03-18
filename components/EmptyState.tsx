import InformationCircleIcon from '@heroicons/react/24/outline/InformationCircleIcon';
import { useTranslation } from 'next-i18next';
import { LinkPrimary } from '@components/LinkPrimary';

const EmptyState = ({
  title,
  href,
  className,
  description,
}: {
  title: string;
  href?: string;
  className?: string;
  description?: string;
}) => {
  const { t } = useTranslation('common');

  return (
    <div
      className={`my-3 flex flex-col items-center justify-center space-y-3 rounded border py-32 ${className}`}>
      <InformationCircleIcon className='h-10 w-10' />
      <h4 className='text-center'>{title}</h4>
      {description && <p className='text-center text-gray-500'>{description}</p>}
      {href && <LinkPrimary href={href}>{t('create_new')}</LinkPrimary>}
    </div>
  );
};

export default EmptyState;
