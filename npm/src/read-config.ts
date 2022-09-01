import * as fs from 'fs';
import * as path from 'path';
import { IdPConnection } from './typings';

const readConfig = async (preLoadedConfig: string): Promise<IdPConnection[]> => {
  if (preLoadedConfig.startsWith('./')) {
    preLoadedConfig = path.resolve(process.cwd(), preLoadedConfig);
  }

  const files = await fs.promises.readdir(preLoadedConfig);
  const configs: IdPConnection[] = [];

  for (const idx in files) {
    const file = files[idx];
    if (file.endsWith('.js')) {
      const { default: config }: { default: IdPConnection } = await import(
        /* webpackIgnore: true */ path.join(preLoadedConfig, file)
      );
      if (!config.oidcDiscoveryUrl) {
        const rawMetadata = await fs.promises.readFile(
          path.join(preLoadedConfig, path.parse(file).name + '.xml'),
          'utf8'
        );
        config.encodedRawMetadata = Buffer.from(rawMetadata, 'utf8').toString('base64');
      }

      configs.push(config);
    }
  }

  return configs;
};

export default readConfig;
