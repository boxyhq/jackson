const getTargetPath = ({ target }) => {
  return `${target}`;
};

/** @type {import('@builder.io/mitosis').MitosisConfig} */
module.exports = {
  // The files that we want mitosis to compile
  files: 'sdk/ui/react/src/*',
  targets: ['react', 'vue3', 'vue2', 'solid', 'angular', 'svelte'],
  getTargetPath,
  options: {
    react: {
      stateType: 'useState',
    },
    vue3: {
      api: 'composition',
    },
  },
};
