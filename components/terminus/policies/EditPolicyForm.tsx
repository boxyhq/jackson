import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Card, LinkBack } from '@boxyhq/internal-ui';
import { CheckSquare, Info, Square, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { successToast } from '@components/Toaster';
import { Button } from 'react-daisyui';
import { PII_POLICY, SUPPORTED_LANGUAGES } from 'internal-ui/src/chat/types';

type entityState = {
  type: string;
  description: string;
  region: string;
};

type formState = {
  piiPolicy: string;
  product: string;
  language: string;
  piiEntities: Array<entityState>;
  selectedRegions: Array<string>;
};

type editFormProps = {
  piiPolicy: string;
  product: string;
  language: string;
  piiEntities: string;
};

const initialState = {
  piiPolicy: '',
  product: '',
  language: '',
  piiEntities: [],
  selectedRegions: [],
};

const EditPolicyForm = ({ piiPolicy, product, language, piiEntities }: editFormProps) => {
  // Initial entity options
  const [initialEntities, setInitialEntities] = useState<Array<entityState>>([]);

  // Form state
  const [formData, setFormData] = useState<formState>(initialState);

  const { t } = useTranslation('common');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hoveredEntity, setHoveredEntity] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRegions, setExpandedRegions] = useState({});
  const [showAllEntities, setShowAllEntities] = useState(false);

  // Available options
  const [regions, setRegions] = useState<Array<string>>([]);
  const languages = SUPPORTED_LANGUAGES;
  const policies = Object.values(PII_POLICY).filter((value) => value !== 'None');

  const getDescription = (type) => {
    const descriptions = {
      AU_ABN: 'Australian Business Number, a unique identifier for businesses in Australia.',
      AU_ACN: 'Australian Company Number, a unique identifier for companies in Australia.',
      AU_TFN: 'Tax File Number, used for tax purposes in Australia.',
      AU_MEDICARE: 'Medicare card number for health services in Australia.',
      IN_AADHAAR: 'Aadhaar number, a unique identification number issued in India.',
      IN_PAN: 'Permanent Account Number, used for tax identification in India.',
      IN_PASSPORT: 'Passport number for international travel from India.',
      IN_VOTER: 'Voter ID number used for electoral purposes in India.',
      IN_VEHICLE_REGISTRATION: 'Vehicle registration number in India.',
      SG_NRIC_FIN: 'National Registration Identity Card/Foreign Identification Number in Singapore.',
      UK_NHS: 'National Health Service number in the United Kingdom.',
      US_ITIN: 'Individual Taxpayer Identification Number issued by the IRS.',
      US_PASSPORT: 'Passport number for international travel issued by the U.S.',
      US_SSN: 'Social Security Number format: XXX-XX-XXXX',
      US_BANK_NUMBER: 'Bank account numbers used for transactions.',
      US_DRIVER_LICENSE: "Driver's license numbers issued by U.S. states.",
    };

    return descriptions[type] || 'No description available.';
  };

  const getRegionByType = (type) => {
    const identifier = initialEntities.find((item) => item.type === type);

    return identifier ? identifier.region : '';
  };

  useEffect(() => {
    (async function () {
      const entitiesResp = await fetch(`/api/admin/llm-vault/policies/entities`);
      const entitiesList = (await entitiesResp.json())?.data;

      const convertedIdentifiers: Array<entityState> = [];
      const regionList = Object.keys(entitiesList);

      for (const [region, types] of Object.entries(entitiesList)) {
        (types as Array<string>).forEach((type) => {
          convertedIdentifiers.push({
            type: type,
            description: getDescription(type),
            region: region,
          });
        });
      }

      setInitialEntities(convertedIdentifiers);
      setRegions(regionList);
    })();
  }, []);

  useEffect(() => {
    toggleAllRegions();
    const convertedIdentifiers: Array<entityState> = [];

    piiEntities.split(',').forEach((type) =>
      convertedIdentifiers.push({
        type: type,
        description: getDescription(type),
        region: getRegionByType(type),
      })
    );

    setFormData({
      piiPolicy,
      product,
      language,
      piiEntities: convertedIdentifiers,
      selectedRegions: [],
    });
  }, [initialEntities]);

  const getCleanedType = (type: string) => {
    const cleanedType = type.replace(/^AU_|^IN_|^SG_|^UK_|^US_/, '');
    return cleanedType;
  };

  const filteredEntities = useMemo(() => {
    if (!searchQuery) return initialEntities;
    const query = searchQuery.toLowerCase();
    return initialEntities.filter((entity) => entity.type.toLowerCase().includes(query));
  }, [searchQuery, initialEntities]);

  const areAllFilteredEntitiesSelected = filteredEntities.every((entity) =>
    formData.piiEntities.some((e) => e.type === entity.type)
  );

  const toggleAllFilteredEntities = () => {
    setFormData((prev) => {
      if (areAllFilteredEntitiesSelected) {
        // Remove all filtered entities
        return {
          ...prev,
          piiEntities: prev.piiEntities.filter(
            (selected) => !filteredEntities.some((filtered) => filtered.type === selected.type)
          ),
          selectedRegions: [],
        };
      } else {
        // Add all filtered entities that aren't already selected
        const currentSelected = new Set(prev.piiEntities.map((e) => e.type));
        const newEntities = filteredEntities.filter((entity) => !currentSelected.has(entity.type));
        return {
          ...prev,
          piiEntities: [...prev.piiEntities, ...newEntities],
          selectedRegions: regions,
        };
      }
    });
  };

  const selectCount = () => {
    return `${formData.piiEntities.length} of ${initialEntities.length} entities selected`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleEntity = (entity) => {
    setFormData((prev) => {
      const isSelected = prev.piiEntities.some((e) => e.type === entity.type);
      return {
        ...prev,
        piiEntities: isSelected
          ? prev.piiEntities.filter((e) => e.type !== entity.type)
          : [...prev.piiEntities, entity],
      };
    });
  };

  const toggleRegion = (region) => {
    setFormData((prev) => {
      const isSelected = prev.selectedRegions.some((e) => e === region);
      return {
        ...prev,
        piiEntities: isSelected
          ? prev.piiEntities.filter((e) => e.region !== region)
          : [...prev.piiEntities, ...initialEntities.filter((e) => e.region === region)],
        selectedRegions: isSelected
          ? prev.selectedRegions.filter((e) => e !== region)
          : [...prev.selectedRegions, region],
      };
    });
  };

  const toggleAllRegions = () => {
    if (showAllEntities) {
      regions.forEach((region) => {
        handleToggleCustom(region, false);
      });
      setShowAllEntities(false);
    } else {
      regions.forEach((region) => {
        handleToggleCustom(region, true);
      });
      setShowAllEntities(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/llm-vault/policies/${formData.product}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: formData.product,
          piiPolicy: formData.piiPolicy,
          piiEntities: formData.piiEntities.map((e) => e.type).toString(),
          language: formData.language,
        }),
      });

      if (response.ok) {
        successToast(t('policy_update_success_toast'));
      }
      if (!response.ok) throw new Error('Failed to edit policy');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (region) => {
    console.log('Toggling expanded regions');

    setExpandedRegions((prev) => {
      const newExpandedState = {
        ...prev,
        [region]: prev[region] !== undefined ? !prev[region] : true,
      };
      setShowAllEntities(Object.values(newExpandedState).every((value) => value === true));
      return newExpandedState;
    });
  };

  const handleToggleCustom = (region, value) => {
    console.log('Toggling expanded regions');

    setExpandedRegions((prev) => {
      const newExpandedState = {
        ...prev,
        [region]: value,
      };

      return newExpandedState;
    });
  };

  return (
    <>
      <div className='max-w-5xl mx-auto p-4'>
        <LinkBack href='/admin/llm-vault/policies' />
        <div className='mt-2.5'>
          <Card>
            <div className='mt-2.5 ml-2.5'>
              <h2 className='card-title text-xl font-medium leading-none tracking-tight gap-4'>
                {t('edit_policy')}
              </h2>
              <div className='text-gray-600 dark:text-gray-400 text-sm gap-4'>{t('new_llm_policy_desc')}</div>
            </div>
            <Card.Body>
              <form onSubmit={handleSubmit} className='space-y-6'>
                {error && (
                  <Alert variant='error'>
                    <h3>{t('bui-traces-error')}</h3>
                    <h3>{error}</h3>
                  </Alert>
                )}

                <div className='space-y-2'>
                  <label className='text-sm font-medium'>
                    {t('bui-shared-product')}
                    <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    name='product'
                    value={formData.product}
                    onChange={handleChange}
                    className='bg-white w-full p-2 border rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                    disabled
                  />
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium'>
                    {t('bui-chat-pii-policy')}
                    <span className='text-red-500'>*</span>
                  </label>
                  <select
                    name='piiPolicy'
                    value={formData.piiPolicy}
                    onChange={handleChange}
                    className='bg-white w-full p-2 border rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                    required>
                    <option value=''>{t('select_policy')}</option>
                    {policies.map((piiPolicy) => (
                      <option key={piiPolicy} value={piiPolicy}>
                        {piiPolicy}
                      </option>
                    ))}
                  </select>
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium'>
                    {t('language')}
                    <span className='text-red-500'>*</span>
                  </label>
                  <select
                    name='language'
                    value={formData.language}
                    onChange={handleChange}
                    className='bg-white w-full p-2 border rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                    required>
                    <option value=''>{t('select_language')}</option>
                    {languages.map((language) => (
                      <option key={language} value={language}>
                        {language}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Entities Section */}
                {/* Compact Entity Grid */}
                <div className='space-y-4'>
                  <div className='flex justify-between items-center'>
                    <label className='text-sm font-medium'>
                      {t('select_entities')}
                      <span className='text-red-500'>*</span>
                    </label>
                  </div>

                  {/* Search Input */}
                  <div>
                    <div className='relative'>
                      <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                      <input
                        type='text'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder='Search entities...'
                        className='bg-white w-full pl-10 pr-10 py-2 border rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                      />
                      {searchQuery && (
                        <button
                          type='button'
                          onClick={() => setSearchQuery('')}
                          className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'>
                          <X className='w-4 h-4' />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Selected count */}
                  <div className='flex justify-between items-center'>
                    <div className='text-sm text-gray-600'>{selectCount()}</div>
                    <div className='flex justify-between gap-2'>
                      <button
                        type='button'
                        onClick={toggleAllFilteredEntities}
                        className='flex items-center text-sm text-teal-600 hover:text-teal-800 focus:outline-none'>
                        {areAllFilteredEntitiesSelected ? (
                          <>
                            <CheckSquare className='w-4 h-4 mr-1' />
                            {t('unselect_all')}
                          </>
                        ) : (
                          <>
                            <Square className='w-4 h-4 mr-1' />
                            {t('select_all')}
                          </>
                        )}
                      </button>
                      <button
                        type='button'
                        onClick={toggleAllRegions}
                        className='flex items-center text-sm text-teal-600 hover:text-teal-800 focus:outline-none'>
                        {showAllEntities ? (
                          <>
                            <CheckSquare className='w-4 h-4 mr-1' />
                            {t('collapse_all')}
                          </>
                        ) : (
                          <>
                            <Square className='w-4 h-4 mr-1' />
                            {t('expand_all')}
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Entity Grid */}
                  <div className='grid grid-flow-row auto-rows-max gap-2'>
                    {regions.map((region) => (
                      <div className='flex gap-2' key={region}>
                        <div key={region} className='min-w-32'>
                          <div
                            className={`w-full px-3 py-2 text-sm rounded-md flex items-center justify-between transition-colors cursor-pointer ${
                              formData.piiEntities
                                .filter((e) => e.region === region)
                                .sort()
                                .toString() ===
                              initialEntities
                                .filter((e) => e.region === region)
                                .sort()
                                .toString()
                                ? 'border-teal-200 text-teal-300'
                                : 'hover:bg-gray-300 border-gray-500'
                            } border`}>
                            <button
                              type='button'
                              onClick={() => toggleRegion(region)}
                              onMouseEnter={() => setHoveredEntity(region)}
                              onMouseLeave={() => setHoveredEntity('')}
                              className='flex items-center text-sm text-teal-800 hover:text-teal-900 focus:outline-none'>
                              {formData.piiEntities.some((e) => e.region === region) ? (
                                <>
                                  <CheckSquare className='w-4 h-4 mr-1' />
                                  {region}
                                </>
                              ) : (
                                <>
                                  <Square className='w-4 h-4 mr-1' />
                                  {region}
                                </>
                              )}
                            </button>

                            <button
                              type='button'
                              onClick={() => {
                                handleToggle(region);
                              }}>
                              {expandedRegions[region] ? '-' : '+'}
                            </button>
                          </div>

                          {/* Tooltip */}
                          {hoveredEntity === region && (
                            <div className='absolute z-10 w-48 p-2 mt-1 text-sm bg-gray-900 text-white rounded-md shadow-lg'>
                              {region}
                            </div>
                          )}
                        </div>
                        <div className='flex flex-wrap flex-row gap-2'>
                          {filteredEntities.map(
                            (entity) =>
                              entity.region === region &&
                              expandedRegions[region] && (
                                <div key={entity.type} className='flex flex-wrap gap-2'>
                                  <button
                                    type='button'
                                    onClick={() => toggleEntity(entity)}
                                    className={`w-full px-3 py-2 text-sm rounded-md flex items-center justify-between transition-colors ${
                                      formData.piiEntities.some((e) => e.type === entity.type)
                                        ? 'bg-teal-100 border-teal-500 text-teal-700'
                                        : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                                    } border`}>
                                    <span className='truncate mr-2'>{getCleanedType(entity.type)}</span>
                                    <div className='z-10 tooltip' data-tip={entity.description}>
                                      <Info className='w-4 h-4 flex-shrink-0 text-gray-400' />
                                    </div>
                                  </button>
                                </div>
                              )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* No results message */}
                  {filteredEntities.length === 0 && (
                    <div className='text-center py-4 text-gray-500'>
                      {t('no_entities_found')} &quot;{searchQuery}&quot;
                    </div>
                  )}
                </div>

                <div className='flex gap-2 justify-end pt-6'>
                  <Button type='submit' className='btn btn-primary btn-md' loading={loading}>
                    {loading ? 'Saving Policy...' : 'Save Policy'}
                  </Button>
                </div>
              </form>
            </Card.Body>
          </Card>
        </div>
      </div>
    </>
  );
};

export default EditPolicyForm;
