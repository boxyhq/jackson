import readConfig from '../src/read-config';

const configRecords: Array<any> = [];

const addIdPConnections = async (metadataPath, configAPIController, idpEnabledConfigAPIController?) => {
  const configs = await readConfig(metadataPath);
  for (const config of configs) {
    const _record = await (config.oidcDiscoveryUrl
      ? configAPIController.createOIDCConfig(config)
      : configAPIController.createSAMLConfig(config));
    !config.oidcDiscoveryUrl &&
      idpEnabledConfigAPIController &&
      (await idpEnabledConfigAPIController.createSAMLConfig(config));
    configRecords.push(_record);
  }
  return configRecords;
};

export { addIdPConnections };
