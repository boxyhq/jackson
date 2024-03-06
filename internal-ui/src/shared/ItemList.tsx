import { useTranslation } from 'next-i18next';
import XMarkIcon from '@heroicons/react/24/outline/XMarkIcon';

export const ItemList = ({
  currentlist,
  onItemListChange,
}: {
  currentlist: string | string[];
  onItemListChange: (list: string[]) => void;
}) => {
  const { t } = useTranslation('common');

  const list = Array.isArray(currentlist) ? currentlist : [currentlist];

  const addAnother = () => {
    onItemListChange([...list, '']);
  };

  return (
    <div>
      <div className='flex flex-col gap-4'>
        {list.map((item, index) => (
          <div key={index}>
            <ItemRow
              item={item}
              onItemChange={(newItem) => {
                const newList = [...list];
                newList[index] = newItem;
                onItemListChange(newList);
              }}
              onItemDelete={() => {
                onItemListChange(list.filter((_, i) => i !== index));
              }}
            />
          </div>
        ))}
        <div>
          <button className='btn btn-primary btn-sm btn-outline' type='button' onClick={addAnother}>
            {t('bui-fs-add')}
          </button>
        </div>
      </div>
    </div>
  );
};

const ItemRow = ({
  item,
  onItemChange,
  onItemDelete,
}: {
  item: string;
  onItemChange: (newItem: string) => void;
  onItemDelete: () => void;
}) => {
  return (
    <div className='flex space-x-3 items-center'>
      <input
        type='text'
        className='input input-bordered input-sm w-full'
        name='item'
        value={item}
        onChange={(e) => {
          onItemChange(e.target.value);
        }}
        required
      />
      <button type='button' onClick={onItemDelete}>
        <XMarkIcon className='h-5 w-5 text-red-500' />
      </button>
    </div>
  );
};
