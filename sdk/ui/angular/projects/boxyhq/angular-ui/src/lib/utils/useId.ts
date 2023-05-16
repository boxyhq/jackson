import htmlIdGenerator from '../utils/htmlIdGenerator';

/**
 *
 * @param component Pass the SDK component name here (e.g., sso)
 * @param elementType Pass the HTML element type for which the Id is to be generated (e.g., input)
 * @returns {string} Id that is gauranteed to be unique suitable for use as HTML id attributes
 */

const getUniqueId = (component: string, elementType?: string) => {
  let id = '';

  // call the htmlIdGenerator function to set a unique id for the user and then return it
  id = htmlIdGenerator(component, elementType);

  return id;
};

export default getUniqueId;
