import { useTranslation } from 'next-i18next';
import { copyToClipboard } from '@lib/ui/utils';
import { ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { successToast } from '@components/Toaster';

export const InputWithCopyButton = ({ value }: { value: string }) => {
  const { t } = useTranslation('common');

  return (
    <div className='flex flex-row items-center rounded-md border border-base-300 pr-1'>
      <input type='text' className='input w-full focus:outline-none' defaultValue={value} readOnly />
      <button
        className='btn-ghost btn-square btn border-none'
        onClick={() => {
          copyToClipboard(value);
          successToast(t('copied'));
        }}>
        <ClipboardDocumentIcon className='h-6 w-6' />
      </button>
    </div>
  );
};
