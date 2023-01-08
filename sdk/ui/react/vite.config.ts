// this is the build config for this demo library source, not the playground
// the build config for the library playground (document) is located at docs/vite.config.ts

import { resolve } from 'path';
import { defineConfig } from 'vite';
import typescript from '@rollup/plugin-typescript';
import react from '@vitejs/plugin-react';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  build: {
    // use vite library mode to build the package
    // https://vitejs.dev/guide/build.html#library-mode
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'BoxyHQUI',
      // the proper extensions will be added
      fileName: '@boxyhq/react-ui',
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['react'],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          react: 'React',
        },
      },
    },
  },
  plugins: [
    react(),
    cssInjectedByJsPlugin({
      injectCode: (cssCode) => {
        return `try{if(typeof document != 'undefined'){var sdkStyles = document.createElement('style');sdkStyles.appendChild(document.createTextNode(${cssCode}));var firstStyleNode = document.head.getElementsByTagName('style')[0];document.head.insertBefore(sdkStyles,firstStyleNode);}}catch(e){console.error('vite-plugin-css-injected-by-js', e);}`;
      },
      topExecutionPriority: true,
    }),
    // typescript({ declaration: true }),
    // use @rollup/plugin-typescript to generate .d.ts files
    // https://github.com/rollup/plugins/tree/master/packages/typescript#noforceemit
    typescript({
      declaration: true,
      emitDeclarationOnly: true,
      noForceEmit: true,
      declarationDir: resolve(__dirname, 'dist/types'),
      rootDir: resolve(__dirname, 'src'),
      exclude: ['**/demos/*', '**/utils/*', '**/hooks/*'],
    }),
  ],
});
