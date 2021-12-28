import * as fs from 'fs';
import * as path from 'path';
import { IdPConfig } from './typings';

const readConfig = async (preLoadedConfig: string): Promise<IdPConfig[]> => {
  if (preLoadedConfig.startsWith('./')) {
    preLoadedConfig = path.resolve(process.cwd(), preLoadedConfig);
  }

  const files = await fs.promises.readdir(preLoadedConfig);
  const configs: IdPConfig[] = [];

  for (let idx in files) {
    const file = files[idx];
    if (file.endsWith('.js')) {
      const config = require(path.join(preLoadedConfig, file)) as IdPConfig;
      const rawMetadata = await fs.promises.readFile(
        path.join(preLoadedConfig, path.parse(file).name + '.xml'),
        'utf8'
      );
      config.rawMetadata = rawMetadata;
      configs.push(config);
    }
  }

  return configs;
};

export default readConfig;
