import { useTranslation } from 'next-i18next';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ButtonOutline } from './ButtonOutline';

export const pageLimit = 50;

export const Pagination = ({
  itemsCount,
  offset,
  onPrevClick,
  onNextClick,
}: {
  itemsCount: number;
  offset: number;
  onPrevClick: () => void;
  onNextClick: () => void;
}) => {
  const { t } = useTranslation('common');

  // Hide pagination if there are no items to paginate.
  if ((itemsCount === 0 && offset === 0) || (itemsCount < pageLimit && offset === 0)) {
    return null;
  }

  const prevDisabled = offset === 0;
  const nextDisabled = itemsCount < pageLimit || itemsCount === 0;

  return (
    <div className='flex justify-center space-x-4 py-4'>
      <ButtonOutline
        className='btn-md'
        Icon={ArrowLeft}
        aria-label={t('bui-shared-previous') as string}
        onClick={onPrevClick}
        disabled={prevDisabled}>
        {t('bui-shared-previous')}
      </ButtonOutline>
      <ButtonOutline
        className='btn-md'
        Icon={ArrowRight}
        aria-label={t('bui-shared-next') as string}
        onClick={onNextClick}
        disabled={nextDisabled}>
        {t('bui-shared-next')}
      </ButtonOutline>
    </div>
  );
};
