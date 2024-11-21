/* eslint-disable i18next/no-literal-string */
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Card, LinkBack } from '@boxyhq/internal-ui';
import { CheckSquare, Info, Square, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AddPolicyForm = () => {
  // Initial entity options
  const initialEntities = [
    {
      type: 'CREDIT_CARD',
      description: 'A credit card number is between 12 to 19 digits.',
      region: 'GLOBAL',
    },
    {
      type: 'CRYPTO',
      description: 'A Crypto wallet number. Currently only Bitcoin address is supported',
      region: 'GLOBAL',
    },
    { type: 'SSN', description: 'Social Security Number format: XXX-XX-XXXX', region: 'GLOBAL' },
    { type: 'EMAIL', description: 'Valid email address format', region: 'US' },
    { type: 'PHONE', description: 'Phone numbers in various international formats', region: 'US' },
    { type: 'PASSPORT', description: 'International passport numbers', region: 'US' },
    { type: 'IP_ADDRESS', description: 'IPv4 and IPv6 addresses', region: 'UK' },
    { type: 'DOB', description: 'Date of birth in various formats', region: 'UK' },
    { type: 'ADDRESS', description: 'Physical address information', region: 'UK' },
    { type: 'BANK_ACCOUNT', description: 'Bank account numbers', region: 'GLOBAL' },
    { type: 'DRIVER_LICENSE', description: "Driver's license numbers", region: 'GLOBAL' },
    { type: 'MEDICAL_ID', description: 'Medical identification numbers', region: 'Spain' },
    { type: 'API_KEY', description: 'API keys and access tokens', region: 'Spain' },
    { type: 'USERNAME', description: 'User account identifiers', region: 'India' },
    { type: 'PASSWORD', description: 'Password patterns and hashes', region: 'India' },
  ];

  // Form state
  const [formData, setFormData] = useState({
    policy: '',
    product: '',
    description: '',
    region: '',
    language: '',
    selectedEntities: [],
    selectedRegions: [],
  });

  const { t } = useTranslation('common');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hoveredEntity, setHoveredEntity] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRegions, setExpandedRegions] = useState({});
  const [showAllEntities, setShowAllEntities] = useState(false);

  // Available options
  const regions = ['GLOBAL', 'US', 'UK', 'Spain', 'India'];
  const languages = ['English', 'Spanish', 'French', 'German', 'Chinese'];
  const policies = ['Detect & Mask', 'Detect & Redact', 'Detect & Report', 'Detect & Block'];

  useEffect(() => {
    toggleAllRegions();
  }, []);

  const filteredEntities = useMemo(() => {
    if (!searchQuery) return initialEntities;
    const query = searchQuery.toLowerCase();
    return initialEntities.filter((entity) => entity.type.toLowerCase().includes(query));
  }, [searchQuery]);

  const areAllFilteredEntitiesSelected = filteredEntities.every((entity) =>
    formData.selectedEntities.some((e) => e.type === entity.type)
  );

  const toggleAllFilteredEntities = () => {
    setFormData((prev) => {
      if (areAllFilteredEntitiesSelected) {
        // Remove all filtered entities
        return {
          ...prev,
          selectedEntities: prev.selectedEntities.filter(
            (selected) => !filteredEntities.some((filtered) => filtered.type === selected.type)
          ),
        };
      } else {
        // Add all filtered entities that aren't already selected
        const currentSelected = new Set(prev.selectedEntities.map((e) => e.type));
        const newEntities = filteredEntities.filter((entity) => !currentSelected.has(entity.type));
        return {
          ...prev,
          selectedEntities: [...prev.selectedEntities, ...newEntities],
        };
      }
    });
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
      const isSelected = prev.selectedEntities.some((e) => e.type === entity.type);
      return {
        ...prev,
        selectedEntities: isSelected
          ? prev.selectedEntities.filter((e) => e.type !== entity.type)
          : [...prev.selectedEntities, entity],
      };
    });
  };

  const toggleRegion = (region) => {
    setFormData((prev) => {
      const isSelected = prev.selectedRegions.some((e) => e === region);
      return {
        ...prev,
        selectedEntities: isSelected
          ? prev.selectedEntities.filter((e) => e.region !== region)
          : [...prev.selectedEntities, ...initialEntities.filter((e) => e.region === region)],
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
      const response = await fetch('/api/admin/llm-vault/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create policy');
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
      <div className='max-w-3xl mx-auto p-4'>
        <LinkBack href='/admin/llm-vault/policies' />
        <div style={{ marginTop: '10px' }}>
          <Card>
            <div style={{ marginLeft: '10px', marginTop: '10px' }}>
              <h2 className='card-title text-xl font-medium leading-none tracking-tight gap-4'>
                Create New Policy
              </h2>
              <div className='text-gray-600 dark:text-gray-400 text-sm gap-4'>
                Configure a new LLM policy to manage data protection rules
              </div>
            </div>
            <Card.Body>
              <form onSubmit={handleSubmit} className='space-y-6'>
                {error && (
                  <Alert variant='error'>
                    <h3>Error</h3>
                    <h3>{error}</h3>
                  </Alert>
                )}

                <div className='space-y-2'>
                  <label className='text-sm font-medium'>
                    Product
                    <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    name='product'
                    value={formData.product}
                    onChange={handleChange}
                    className='w-full p-2 border rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                    style={{ backgroundColor: 'white' }}
                    required
                  />
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium'>
                    Policy
                    <span className='text-red-500'>*</span>
                  </label>
                  <select
                    name='policy'
                    value={formData.policy}
                    onChange={handleChange}
                    className='w-full p-2 border rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                    style={{ backgroundColor: 'white' }}
                    required>
                    <option value=''>Select a Policy</option>
                    {policies.map((policy) => (
                      <option key={policy} value={policy}>
                        {policy}
                      </option>
                    ))}
                  </select>
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium'>
                    Language
                    <span className='text-red-500'>*</span>
                  </label>
                  <select
                    name='language'
                    value={formData.language}
                    onChange={handleChange}
                    className='w-full p-2 border rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                    style={{ backgroundColor: 'white' }}
                    required>
                    <option value=''>Select a language</option>
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
                      Select Entities to Monitor
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
                        style={{ backgroundColor: 'white' }}
                        className='w-full pl-10 pr-10 py-2 border rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent'
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
                    <div className='text-sm text-gray-600'>
                      {formData.selectedEntities.length} of {initialEntities.length} entities selected
                    </div>
                    <div className='flex justify-between gap-2'>
                      <button
                        type='button'
                        onClick={toggleAllFilteredEntities}
                        className='flex items-center text-sm text-teal-600 hover:text-teal-800 focus:outline-none'>
                        {areAllFilteredEntitiesSelected ? (
                          <>
                            <CheckSquare className='w-4 h-4 mr-1' />
                            Deselect All
                          </>
                        ) : (
                          <>
                            <Square className='w-4 h-4 mr-1' />
                            Select All
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
                            Collapse All
                          </>
                        ) : (
                          <>
                            <Square className='w-4 h-4 mr-1' />
                            Expand All
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
                          <label
                            className={`w-full px-3 py-2 text-sm rounded-md flex items-center justify-between transition-colors cursor-pointer ${
                              formData.selectedEntities
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
                              onClick={(e) => toggleRegion(region)}
                              onMouseEnter={() => setHoveredEntity(region)}
                              onMouseLeave={() => setHoveredEntity(null)}
                              className='flex items-center text-sm text-teal-800 hover:text-teal-900 focus:outline-none'>
                              {formData.selectedEntities.some((e) => e.region === region) ? (
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
                          </label>

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
                                    onMouseEnter={() => setHoveredEntity(entity.type)}
                                    onMouseLeave={() => setHoveredEntity(null)}
                                    className={`w-full px-3 py-2 text-sm rounded-md flex items-center justify-between transition-colors ${
                                      formData.selectedEntities.some((e) => e.type === entity.type)
                                        ? 'bg-teal-100 border-teal-500 text-teal-700'
                                        : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                                    } border`}>
                                    <span className='truncate mr-2'>{entity.type}</span>
                                    <Info className='w-4 h-4 flex-shrink-0 text-gray-400' />
                                  </button>

                                  {/* Tooltip */}
                                  {hoveredEntity === entity.type && (
                                    <div className='absolute z-10 w-48 p-2 mt-1 text-sm bg-gray-900 text-white rounded-md shadow-lg'>
                                      {entity.description}
                                    </div>
                                  )}
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
                      No entities found matching &quot;{searchQuery}&quot;
                    </div>
                  )}
                </div>

                <button
                  type='submit'
                  disabled={loading}
                  className='w-full text-white py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                  style={{ backgroundColor: '#25c2a0' }}>
                  {loading ? 'Creating Policy...' : 'Create Policy'}
                </button>
              </form>
            </Card.Body>
          </Card>
        </div>
      </div>
    </>
  );
};

export default AddPolicyForm;
