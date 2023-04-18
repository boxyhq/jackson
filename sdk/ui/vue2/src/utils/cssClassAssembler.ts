const cssClassAssembler = (customClasses = '', defaultClasses: string) =>
  customClasses ? customClasses : defaultClasses;

export default cssClassAssembler;