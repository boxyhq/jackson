const colors = require('tailwindcss/colors');

function withOpacityValue(variable) {
  return ({ opacityValue }) => {
    if (opacityValue === undefined) {
      return `rgb(var(${variable}))`;
    }
    return `rgb(var(${variable}) / ${opacityValue})`;
  };
}

module.exports = {
  darkMode: 'class',
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    colors: {
      ...colors,
      primary: withOpacityValue('--color-primary'),
      secondary: withOpacityValue('--color-secondary'),
    },
    backgroundImage: {
      'polka-pattern': 'radial-gradient(#266e5e 0.5px, #25c2a0 0.5px)',
    },
  },
  plugins: [],
};
