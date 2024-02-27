import { Button } from 'react-daisyui';
import { useTranslation } from 'next-i18next';

import { Card } from '../shared';
import type { SetupLink } from '../types';
import { InputWithCopyButton } from '../shared/InputWithCopyButton';

export const SetupLinkInfo = ({ setupLink, onClose }: { setupLink: SetupLink; onClose: () => void }) => {
  const { t } = useTranslation('common');

  return (
    <>
      <Card className='border-primary'>
        <Card.Body>
          <div>
            <InputWithCopyButton
              text={setupLink.url}
              label='Share this link with your customers to allow them to set up the integration'
            />
          </div>
          <div>
            <Button size='sm' color='primary' onClick={onClose}>
              Close
            </Button>
          </div>
        </Card.Body>
      </Card>
    </>
  );
};
