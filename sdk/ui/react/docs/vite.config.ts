import { defineConfig } from 'vite';
import * as path from 'path';
import react from '@vitejs/plugin-react';
import pages, { DefaultPageStrategy } from 'vite-plugin-react-pages';

export default defineConfig({
  plugins: [
    react(),
    pages({
      pagesDir: path.join(__dirname, 'pages'),
      pageStrategy: new DefaultPageStrategy({
        extraFindPages: async (pagesDir, helpers) => {
          const srcPath = path.join(__dirname, '../src');
          if (String(process.env.SHOW_ALL_COMPONENT_DEMOS) === 'true') {
            // show all component demos during dev
            // put them in page `/components/demos/${componentName}`
            helpers.watchFiles(
              srcPath,
              '*/demos/**/*.{[tj]sx,md?(x)}',
              async function fileHandler(file, api) {
                const { relative, path: absolute } = file;
                const match = relative.match(/(.*)\/demos\/(.*)\.([tj]sx|mdx?)$/);
                if (!match) throw new Error('unexpected file: ' + absolute);
                const [_, componentName, demoName] = match;
                const pageId = `/components/demos/${componentName}`;
                // register page data
                api.addPageData({
                  pageId,
                  key: demoName,
                  // register demo runtime data path
                  // the ?demo query will wrap the module with useful demoInfo
                  // that will be consumed by theme-doc
                  dataPath: `${absolute}?demo`,
                  // register demo static data
                  staticData: await helpers.extractStaticData(file),
                });
              }
            );
          }

          // find all component README
          helpers.watchFiles(srcPath, '*/README.md?(x)', async function fileHandler(file, api) {
            const { relative, path: absolute } = file;
            const match = relative.match(/(.*)\/README\.mdx?$/);
            if (!match) throw new Error('unexpected file: ' + absolute);
            const [_, componentName] = match;
            const pageId = `/components/${componentName}`;
            // register page data
            api.addPageData({
              pageId,
              // register demo runtime data path
              dataPath: absolute,
              // register demo static data
              staticData: await helpers.extractStaticData(file),
            });
          });
        },
      }),
    }),
  ],
  resolve: {
    alias: {
      '@boxyhq/react-ui': path.join(__dirname, '../src'),
    },
  },
});
