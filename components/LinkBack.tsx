import ArrowLeftIcon from '@heroicons/react/24/outline/ArrowLeftIcon';
import { useTranslation } from 'next-i18next';
import { LinkOutline } from './LinkOutline';

export const LinkBack = ({ href }: { href: string }) => {
  const { t } = useTranslation('common');
  return (
    <LinkOutline href={href} Icon={ArrowLeftIcon}>
      {t('back')}
    </LinkOutline>
  );
};
