import { FC } from 'react';
import { useTranslation } from 'next-i18next';

interface Props {
  status: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {};
}

export const ConnectionToggle: FC<Props> = (props) => {
  const { status, onChange } = props;

  const { t } = useTranslation('common');

  return (
    <>
      <label className='label cursor-pointer'>
        <span className='label-text mr-2'>{status ? t('active') : t('inactive')}</span>
        <input type='checkbox' className='toggle-success toggle' onChange={onChange} checked={status} />
      </label>
    </>
  );
};
