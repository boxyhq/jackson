const fs = require('fs');
const path = require('path');

module.exports = async function (preLoadedConfig) {
  if (preLoadedConfig.startsWith('./')) {
    preLoadedConfig = path.resolve(process.cwd(), preLoadedConfig);
  }
  const files = await fs.promises.readdir(preLoadedConfig);
  const configs = [];
  for (idx in files) {
    const file = files[idx];
    if (file.endsWith('.js')) {
      const config = require(path.join(preLoadedConfig, file));
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
