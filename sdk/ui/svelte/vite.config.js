import { resolve } from 'path';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    // use vite library mode to build the package
    // https://vitejs.dev/guide/build.html#library-mode
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'BoxyHQUI',
      // the proper extensions will be added
      fileName: '@boxyhq/svelte-ui',
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['svelte'],
      output: {
        globals: {
          // Provide global variables to use in the UMD build
          // for externalized deps
          sveltekit: 'sveltekit',
        },
      },
    },
  },
  plugins: [sveltekit()],
});
