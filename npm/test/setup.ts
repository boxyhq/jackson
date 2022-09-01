import { JacksonOption } from '../src';
import readConfig from '../src/read-config';

const configRecords: Array<any> = [];

const addIdPConnections = async (
  metadataPath,
  connectionAPIController,
  idpEnabledConnectionAPIController?
) => {
  const configs = await readConfig(metadataPath);
  for (const config of configs) {
    const _record = await (config.oidcDiscoveryUrl
      ? connectionAPIController.createOIDCConfig(config)
      : connectionAPIController.createSAMLConnection(config));
    !config.oidcDiscoveryUrl &&
      idpEnabledConnectionAPIController &&
      (await idpEnabledConnectionAPIController.createSAMLConnection(config));
    configRecords.push(_record);
  }
  return configRecords;
};

const options = <JacksonOption>{
  externalUrl: 'https://my-cool-app.com',
  samlAudience: 'https://saml.boxyhq.com',
  samlPath: '/sso/oauth/saml',
  oidcPath: '/sso/oauth/oidc',
  db: {
    engine: 'mem',
  },
  clientSecretVerifier: 'TOP-SECRET',
  openid: {
    jwtSigningKeys: { private: 'PRIVATE_KEY', public: 'PUBLIC_KEY' },
    jwsAlg: 'RS256',
  },
};

export { addIdPConnections, options };
