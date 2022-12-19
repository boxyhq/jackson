import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'next-i18next';
import { ButtonOutline } from './ButtonOutline';

export const Pagination = ({ prevDisabled, nextDisabled, onPrevClick, onNextClick }) => {
  const { t } = useTranslation('common');

  return (
    <div className='mt-4 flex justify-center'>
      <ButtonOutline
        Icon={ArrowLeftIcon}
        aria-label={t('previous')}
        disabled={prevDisabled}
        onClick={onPrevClick}>
        {t('prev')}
      </ButtonOutline>
      &nbsp;&nbsp;&nbsp;&nbsp;
      <ButtonOutline
        Icon={ArrowRightIcon}
        aria-label={t('previous')}
        disabled={nextDisabled}
        onClick={onNextClick}>
        {t('next')}
      </ButtonOutline>
    </div>
  );
};
