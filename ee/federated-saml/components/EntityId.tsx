import { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

import { copyToClipboard } from '@lib/ui/utils';
import { successToast } from '@components/Toaster';

const EntityId = ({ onIdChange }: { onIdChange: (entityId: string) => void }) => {
  const { t } = useTranslation('common');
  const [value, setValue] = useState('');

  const generateId = () => {
    const id = crypto.randomUUID().replace(/-/g, '');
    const entityId = `https://saml.boxyhq.com/${id}`;
    setValue(entityId);
    copyToClipboard(entityId);
    successToast(t('entity_id_generated_copied'));
  };

  useEffect(() => {
    onIdChange(value);
  }, [value]);

  return (
    <label className='form-control w-full'>
      <div className='label'>
        <span className='label-text'>{t('entity_id')}</span>
        <span className='label-text-alt'>
          <div className='flex items-center gap-1'>
            <span className='cursor-pointer border-stone-600 border p-1 rounded' onClick={generateId}>
              {t('generate_sp_entity_id')}
            </span>
            <div className='tooltip tooltip-left' data-tip={t('saml_federation_entity_id_instruction')}>
              <QuestionMarkCircleIcon className='h-5 w-5' />
            </div>
          </div>
        </span>
      </div>
      <input
        type='text'
        className='input input-bordered w-full'
        name='entityId'
        placeholder='https://your-idp.com/saml/entityId'
        required
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </label>
  );
};

export default EntityId;
