import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';
import { useTranslation } from 'next-i18next';

export const Pagination = ({ prevDisabled, nextDisabled, onPrevClick, onNextClick }) => {
  const { t } = useTranslation('common');

  return (
    <div className='mt-4 flex justify-center'>
      <Button
        Icon={ArrowLeftIcon}
        aria-label={t('previous')}
        disabled={prevDisabled}
        variant='outline'
        onClick={onPrevClick}>
        {t('prev')}
      </Button>
      &nbsp;&nbsp;&nbsp;&nbsp;
      <Button
        Icon={ArrowRightIcon}
        aria-label={t('previous')}
        disabled={nextDisabled}
        variant='outline'
        onClick={onNextClick}>
        {t('next')}
      </Button>
    </div>
  );
};
