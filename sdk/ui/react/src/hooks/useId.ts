import { useEffect, useState } from 'react';
import htmlIdGenerator from '../utils/htmlIdGenerator';

/**
 *
 * @param component Pass the SDK component name here (e.g., sso)
 * @param elementType Pass the HTML element type for which the Id is to be generated (e.g., input)
 * @returns {string} Id that is gauranteed to be unique suitable for use as HTML id attributes
 */
const useId = (component: string, elementType?: string) => {
  const [id, setId] = useState('');

  useEffect(() => {
    setId(htmlIdGenerator(component, elementType));
  }, [component, elementType]);

  return id;
};

export default useId;
