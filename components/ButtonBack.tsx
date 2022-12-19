import ArrowLeftIcon from '@heroicons/react/24/outline/ArrowLeftIcon';
import { useTranslation } from 'next-i18next';
import { Button } from './Button';

export const ButtonBack = ({ onClick = undefined }: { onClick?: any }) => {
  const { t } = useTranslation('common');
  return (
    <Button variant='outline' Icon={ArrowLeftIcon} onClick={onClick}>
      {t('back')}
    </Button>
  );
};
