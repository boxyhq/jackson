module.exports = {
  darkMode: 'media',
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './node_modules/@themesberg/flowbite/**/*.js',
  ],
  theme: {
    extend: {},
  },
  plugins: [require('@themesberg/flowbite/plugin')],
};
