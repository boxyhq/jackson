/** @type {import('@builder.io/mitosis').MitosisConfig} */
module.exports = {
  // The files that we want mitosis to compile
  files: 'sdk/ui/react/src/*',
  targets: ['vue3', 'solid', 'svelte', 'react'],
  options: {
    react: {
      stateType: 'useState',
    },
  },
};
