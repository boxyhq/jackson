import * as fs from 'fs';
import * as path from 'path';
import { IdPConfig } from './typings';

const readConfig = async (preLoadedConfig: string): Promise<IdPConfig[]> => {
  if (preLoadedConfig.startsWith('./')) {
    preLoadedConfig = path.resolve(process.cwd(), preLoadedConfig);
  }

  const files = await fs.promises.readdir(preLoadedConfig);
  const configs: IdPConfig[] = [];

  for (const idx in files) {
    const file = files[idx];
    if (file.endsWith('.js')) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const config = require(path.join(preLoadedConfig, file)) as IdPConfig;
      const rawMetadata = await fs.promises.readFile(
        path.join(preLoadedConfig, path.parse(file).name + '.xml'),
        'utf8'
      );
      config.encodedRawMetadata = Buffer.from(rawMetadata, 'utf8').toString('base64');
      configs.push(config);
    }
  }

  return configs;
};

export default readConfig;
