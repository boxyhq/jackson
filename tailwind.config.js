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
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    'node_modules/daisyui/dist/**/*.js',
  ],
  theme: {
    colors: {
      ...colors,
      primary: withOpacityValue('--color-primary'),
      secondary: withOpacityValue('--color-secondary'),
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        boxyhq: {
          primary: '#25c2a0',
          secondary: '#303846',
          accent: '#570DF8',
          neutral: '#3D4451',
          'base-100': '#FFFFFF',
          info: '#3ABFF8',
          success: '#36D399',
          warning: '#FBBD23',
          error: '#F87272',
        },
      },
    ],
  },
};
