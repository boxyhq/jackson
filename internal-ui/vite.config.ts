import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import typescript from '@rollup/plugin-typescript';

export default defineConfig({
  build: {
    lib: {
      entry: {
        'well-known': resolve(__dirname, 'src/well-known/index.ts'),
        'federated-saml': resolve(__dirname, 'src/federated-saml/index.ts'),
        shared: resolve(__dirname, 'src/shared/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', 'react/jsx-runtime', 'react-dom', 'next', 'next-i18next'],
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
