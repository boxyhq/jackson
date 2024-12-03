import React, { useEffect, useMemo, useState } from 'react';
import { Card, LinkBack, PageHeader } from '@boxyhq/internal-ui';
import { CheckSquare, Info, Square, Search, X } from 'lucide-react';
import { useTranslation } from 'next-i18next';
import { errorToast, successToast } from '@components/Toaster';
import router from 'next/router';
import { Button } from 'react-daisyui';
import { descriptions, PII_POLICY, SupportedLanguages } from 'internal-ui/src/chat/types';
import CodeEditor from './CodeEditor';

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
  accessControlPolicy: string;
};

const initialState = {
  piiPolicy: '',
  product: '',
  language: '',
  piiEntities: [],
  selectedRegions: [],
  accessControlPolicy: '',
};

const AddPolicyForm = () => {
  const { t } = useTranslation('common');
  const [initialEntities, setInitialEntities] = useState<Array<entityState>>([]);
  const [regions, setRegions] = useState<Array<string>>([]);
  const [formData, setFormData] = useState<formState>(initialState);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [hoveredEntity, setHoveredEntity] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRegions, setExpandedRegions] = useState({});
  const [showAllEntities, setShowAllEntities] = useState(false);

  const languages = Object.keys(SupportedLanguages);
  const policies = Object.values(PII_POLICY).filter((value) => value !== 'None');

  useEffect(() => {
    (async function () {
      const entitiesResp = await fetch(`/api/admin/llm-vault/policies/entities`);
      const entitiesObject = (await entitiesResp.json())?.data;

      const convertedIdentifiers: Array<entityState> = [];
      if (entitiesObject) {
        const regionList = Object.keys(entitiesObject);

        for (const [region, types] of Object.entries(entitiesObject)) {
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
      }
    })();
  }, []);

  useEffect(() => {
    showAllRegions();
  }, [initialEntities]);

  const getCleanedType = (type: string) => {
    const cleanedType = type.replace(/^AU_|^IN_|^SG_|^UK_|^US_/, '');
    return cleanedType;
  };

  const getDescription = (type) => {
    return descriptions[type] || 'No description available.';
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

  const setAccessControlPolicy = (value) => {
    setFormData((prev) => ({
      ...prev,
      accessControlPolicy: value,
    }));
  };

  const getSelectedRegions = (entities) => {
    const selected_regions: Array<string> = [];
    regions.forEach((region) => {
      if (entities.some((e) => e.region === region)) {
        selected_regions.push(region);
      }
    });
    return selected_regions.length > 0 ? selected_regions : [];
  };

  const onEntityChange = (entity) => {
    setFormData((prev) => {
      const isSelected = prev.piiEntities.some((e) => e.type === entity.type);
      const newPIIEntities = isSelected
        ? prev.piiEntities.filter((e) => e.type !== entity.type)
        : [...prev.piiEntities, entity];
      const newSelectedRegions = getSelectedRegions(newPIIEntities);
      return {
        ...prev,
        piiEntities: newPIIEntities,
        selectedRegions: newSelectedRegions,
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

  const showAllRegions = () => {
    if (showAllEntities) {
      regions.forEach((region) => {
        showRegionCustom(region, false);
      });
      setShowAllEntities(false);
    } else {
      regions.forEach((region) => {
        showRegionCustom(region, true);
      });
      setShowAllEntities(true);
    }
  };

  const validateForm = (formData: formState) => {
    const errors: { [key: string]: string } = {};

    if (!formData.piiPolicy) {
      errors.piiPolicy = 'PII Policy is required.';
    }

    if (!formData.product) {
      errors.product = 'Product is required.';
    }

    if (!formData.language) {
      errors.language = 'Language is required.';
    }

    if (formData.piiEntities.length === 0) {
      errors.piiEntities = 'At least one PII entity must be selected.';
    }

    if (formData.selectedRegions.length === 0) {
      errors.selectedRegions = 'At least one region must be selected.';
    }

    if (!formData.accessControlPolicy) {
      errors.accessControlPolicy = 'Access Control Policy is required.';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const validationErrors = validateForm(formData);

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      const response = await fetch(`/api/admin/llm-vault/policies/${formData.product}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: formData.product,
          piiPolicy: formData.piiPolicy,
          language: SupportedLanguages[formData.language],
          piiEntities: formData.piiEntities.map((e) => e.type).toString(),
          accessControlPolicy: Buffer.from(formData.accessControlPolicy, 'utf-8').toString('base64'),
        }),
      });

      if (response.ok) {
        successToast(t('llm_policy_saved_success_toast'));
        setFormData(initialState);
        router.push('/admin/llm-vault/policies');
      }
      if (!response.ok) {
        throw new Error(response.statusText);
      }
    } catch (err: any) {
      errorToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  const showRegion = (region) => {
    setExpandedRegions((prev) => {
      const newExpandedState = {
        ...prev,
        [region]: prev[region] !== undefined ? !prev[region] : true,
      };
      setShowAllEntities(Object.values(newExpandedState).every((value) => value === true));
      return newExpandedState;
    });
  };

  const showRegionCustom = (region, value) => {
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
      <LinkBack href='/admin/llm-vault/policies' />
      <PageHeader className='mt-4' title={t('llm_new_policy')} description={t('llm_new_policy_desc')} />
      <div className='mx-auto p-4'>
        <div className='mt-2.5'>
          <Card>
            <Card.Body>
              <form onSubmit={handleSubmit} className='space-y-6'>
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>
                    {t('bui-shared-product')}
                    <span className='text-red-500'>*</span>
                  </label>
                  {errors.product && <span className='text-red-500'>{errors.product}</span>}
                  <input
                    type='text'
                    name='product'
                    value={formData.product}
                    onChange={handleChange}
                    className='bg-white w-full p-2 border rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                    required
                  />
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium'>
                    {t('llm_pii_policy')}
                    <span className='text-red-500'>*</span>
                  </label>
                  {errors.piiPolicy && <span className='text-red-500'>{errors.piiPolicy}</span>}
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
                  {errors.language && <span className='text-red-500'>{errors.language}</span>}
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

                    {errors.piiEntities && <span className='text-red-500'>{errors.piiEntities}</span>}
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
                        onClick={showAllRegions}
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
                              className='w-11/12 flex items-center text-sm text-teal-800 hover:text-teal-900 focus:outline-none'>
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
                                showRegion(region);
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
                                    onClick={() => onEntityChange(entity)}
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

                <div className='space-y-2'>
                  <div className='flex justify-between items-center'>
                    <label className='text-sm font-medium'>
                      {t('llm_access_control_policy')}
                      <span className='text-red-500'>*</span>
                    </label>
                    {errors.accessControlPolicy && (
                      <span className='text-red-500'>{errors.accessControlPolicy}</span>
                    )}
                  </div>
                  <CodeEditor code={formData.accessControlPolicy} setCode={setAccessControlPolicy} />
                </div>

                <div className='flex gap-2 justify-end pt-6'>
                  <Button type='submit' className='btn btn-primary btn-md' loading={loading}>
                    {loading ? 'Creating Policy...' : 'Create Policy'}
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

export default AddPolicyForm;
