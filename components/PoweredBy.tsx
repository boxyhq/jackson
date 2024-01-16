import { useTranslation } from 'next-i18next';

export const PoweredBy = () => {
  const { t } = useTranslation('common');

  return (
    <p className='text-center text-xs text-gray-500 py-5'>
      <a href='https://boxyhq.com/' target='_blank' rel='noopener noreferrer'>
        {t('boxyhq_powered_by')}
      </a>
    </p>
  );
};
