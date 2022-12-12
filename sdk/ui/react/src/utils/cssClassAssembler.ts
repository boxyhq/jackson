const cssClassAssembler = (ignoreDefaultStyles = false, customClasses: string, defaultClasses?: string) =>
  ignoreDefaultStyles ? customClasses : `${defaultClasses} ${customClasses}`;

export default cssClassAssembler;
