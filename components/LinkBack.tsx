import ArrowLeftIcon from '@heroicons/react/24/outline/ArrowLeftIcon';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { ButtonOutline } from './ButtonOutline';

export const LinkBack = () => {
  const { t } = useTranslation('common');
  const router = useRouter();

  return (
    <div className='mb-4 flex'>
      <ButtonOutline
        onClick={() => {
          router.back();
        }}
        Icon={ArrowLeftIcon}>
        {t('back')}
      </ButtonOutline>
    </div>
  );
};
