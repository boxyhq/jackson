import { useTranslation } from 'next-i18next';

export const NoMoreResults = ({ colSpan }: { colSpan: number }) => {
  const { t } = useTranslation('common');

  return (
    <tr>
      <td colSpan={colSpan} className='px-6 py-3 text-center text-sm text-gray-500'>
        {t('bui-shared-no-more-results')}
      </td>
    </tr>
  );
};
