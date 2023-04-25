import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import * as path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@boxyhq/svelte-ui': path.join(__dirname, '../src'),
    },
  },
  plugins: [sveltekit()],
});
