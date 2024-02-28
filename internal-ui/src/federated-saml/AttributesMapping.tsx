import { useTranslation } from 'next-i18next';
import XMarkIcon from '@heroicons/react/24/outline/XMarkIcon';
import type { AttributeMapping } from '../types';

const standardAttributes = {
  saml: [
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname',
    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
    'http://schemas.xmlsoap.org/claims/Group',
  ],
  oidc: ['sub', 'email', 'given_name', 'family_name', 'roles', 'groups'],
};

export const AttributesMapping = ({
  mappings,
  onAttributeMappingsChange,
}: {
  mappings: AttributeMapping[];
  onAttributeMappingsChange: (attributeMappings: AttributeMapping[]) => void;
}) => {
  const { t } = useTranslation('common');

  const addAnother = () => {
    onAttributeMappingsChange([...mappings, { key: '', value: '' }]);
  };

  return (
    <div>
      {mappings.length > 0 && (
        <div className='flex space-x-20 items-center pb-2'>
          <label className='label font-semibold'>
            <span className='label-text'>{t('bui-fs-sp-attribute')}</span>
          </label>
          <label className='label font-semibold'>
            <span className='label-text'>{t('bui-fs-idp-attribute')}</span>
          </label>
        </div>
      )}
      <div className='flex flex-col gap-4'>
        {mappings.map((attributeMapping, index) => (
          <div key={index}>
            <AttributeRow
              attributeMapping={attributeMapping}
              onMappingChange={(newAttributeMapping) => {
                const newMappings = [...mappings];
                newMappings[index] = newAttributeMapping;
                onAttributeMappingsChange(newMappings);
              }}
              onMappingDelete={() => {
                onAttributeMappingsChange(mappings.filter((_, i) => i !== index));
              }}
            />
          </div>
        ))}
        <div>
          <button className='btn btn-primary btn-sm btn-outline' type='button' onClick={addAnother}>
            {mappings.length === 0 ? t('bui-fs-add-mapping') : t('bui-fs-add-another')}
          </button>
        </div>
      </div>
    </div>
  );
};

const AttributeRow = ({
  attributeMapping,
  onMappingChange,
  onMappingDelete,
}: {
  attributeMapping: AttributeMapping;
  onMappingChange: (newAttributeMapping: AttributeMapping) => void;
  onMappingDelete: () => void;
}) => {
  const { t } = useTranslation('common');

  return (
    <div className='flex space-x-3 items-center'>
      <input
        type='text'
        className='input input-bordered input-sm'
        name='attribute'
        value={attributeMapping.key}
        onChange={(e) => {
          onMappingChange({
            key: e.target.value,
            value: attributeMapping.value,
          });
        }}
        required
      />
      <div className='join flex'>
        <div>
          <div>
            <input
              type='text'
              className='input input-bordered input-sm w-full join-item'
              name='mapping'
              value={attributeMapping.value}
              onChange={(e) => {
                onMappingChange({
                  key: attributeMapping.key,
                  value: e.target.value,
                });
              }}
              required
            />
          </div>
        </div>
        <select
          className='select select-bordered join-item select-sm rounded w-40'
          onChange={(e) => {
            onMappingChange({
              key: attributeMapping.key,
              value: e.target.value,
            });
          }}
          value={attributeMapping.value}>
          <option value=''></option>
          <option value='' disabled>
            {t('bui-fs-saml-attributes')}
          </option>
          {standardAttributes.saml.map((attribute) => (
            <option key={attribute}>{attribute}</option>
          ))}
          <option value='' disabled>
            {t('bui-fs-oidc-attributes')}
          </option>
          {standardAttributes.oidc.map((attribute) => (
            <option key={attribute}>{attribute}</option>
          ))}
        </select>
      </div>
      <button type='button' onClick={onMappingDelete}>
        <XMarkIcon className='h-5 w-5 text-red-500' />
      </button>
    </div>
  );
};
