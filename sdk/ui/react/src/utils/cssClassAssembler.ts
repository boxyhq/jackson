const cssClassAssembler = (ignoreDefaultStyles = false, customClasses = '', defaultClasses?: string) =>
  ignoreDefaultStyles ? customClasses : `${defaultClasses} ${customClasses}`;

export default cssClassAssembler;
