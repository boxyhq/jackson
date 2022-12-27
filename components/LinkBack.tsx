import ArrowLeftIcon from '@heroicons/react/24/outline/ArrowLeftIcon';
import { useTranslation } from 'next-i18next';
import { LinkOutline } from './LinkOutline';

export const LinkBack = ({ href, onClick }: { href: string; onClick?: any }) => {
  const { t } = useTranslation('common');
  return (
    <LinkOutline href={href} onClick={onClick} Icon={ArrowLeftIcon} style={{ marginLeft: 0 }}>
      {t('back')}
    </LinkOutline>
  );
};
