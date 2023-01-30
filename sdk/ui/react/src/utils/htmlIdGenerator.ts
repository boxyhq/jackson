/**
 * Util function that helps to generate unique HTML ids that are namespaced by
 * the prefix and element type
 * @param prefix Pass anything that needs to be prefixed to the id
 * @param elementType Pass the HTML element type here (e.g., input)
 * @returns {string} Id that is gauranteed to be unique and suitable for html id attributes across various components
 */
const htmlIdGenerator = (prefix: string, elementType?: string) => {
  const uniqueId = Math.floor(1e6 + Math.random() * 1e6).toString();
  return elementType ? `boxyhq-${prefix}-${elementType}-${uniqueId}` : `boxyhq-${prefix}-${uniqueId}`;
};

export default htmlIdGenerator;
