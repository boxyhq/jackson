import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    // use vite library mode to build the package
    // https://vitejs.dev/guide/build.html#library-mode
  build:{
    lib:{
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'BoxyHQUI',
      // the proper extensions will be added
      fileName: '@boxyhq/vue3-ui',
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['vue'],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
  plugins: [vue()],
})
