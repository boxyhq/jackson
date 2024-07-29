import { Card } from '@boxyhq/internal-ui';
// import ContactSupport from '../contactSupport';
import { useTranslation } from 'next-i18next';

export default function ChatDisabled() {
  const { t } = useTranslation('common');
  return (
    <div className='flex mt-auto w-full'>
      <Card>
        <Card.Body>
          <Card.Header>
            <Card.Title>{t('chat-disabled-title')}</Card.Title>
            <Card.Description>{t('chat-disabled-description')}</Card.Description>
          </Card.Header>
          <div>{/* <ContactSupport /> */}</div>
        </Card.Body>
      </Card>
    </div>
  );
}
