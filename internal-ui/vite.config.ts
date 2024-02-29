import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import typescript from '@rollup/plugin-typescript';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'react',
        'react/jsx-runtime',
        'react-dom',
        '@heroicons/react',
        'classnames',
        'formik',
        'next',
        'next-i18next',
        'react-daisyui',
        'react-syntax-highlighter',
        'react-tagsinput',
        'swr',
      ],
    },
  },
  plugins: [
    react(),
    viteTsconfigPaths(),
    typescript({
      declaration: true,
      emitDeclarationOnly: true,
      noForceEmit: true,
      declarationDir: resolve(__dirname, 'dist/'),
      rootDir: resolve(__dirname, 'src'),
    }),
  ],
});
