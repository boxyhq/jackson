module.exports = {
  mode: 'jit',
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    'node_modules/daisyui/dist/**/*.js',
  ],
  daisyui: {
    themes: [
      {
        boxyhq: {
          primary: '#25c2a0',
        },
      },
    ],
  },
  plugins: [require('daisyui')],
};
