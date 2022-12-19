import ArrowLeftIcon from '@heroicons/react/24/outline/ArrowLeftIcon';
import { useTranslation } from 'next-i18next';
import { ButtonOutline } from './ButtonOutline';

export const ButtonBack = ({ onClick = undefined }: { onClick?: any }) => {
  const { t } = useTranslation('common');
  return (
    <ButtonOutline Icon={ArrowLeftIcon} onClick={onClick}>
      {t('back')}
    </ButtonOutline>
  );
};
