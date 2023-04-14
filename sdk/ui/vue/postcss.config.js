// Had to create this file and install autoprefixer dev dependency to fix vite error: "[plugin:vite:css] [postcss] Cannot read properties of undefined (reading 'config')"
const postcss = {
    plugins: {
      autoprefixer: {},
    },
};

export default postcss;
  