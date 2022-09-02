import { JacksonOption } from '../src';
import loadConnection from '../src/loadConnection';

const connectionRecords: Array<any> = [];

const addIdPConnections = async (
  metadataPath,
  connectionAPIController,
  idpEnabledConnectionAPIController?
) => {
  const connections = await loadConnection(metadataPath);
  for (const connection of connections) {
    const _record = await (connection.oidcDiscoveryUrl
      ? connectionAPIController.createOIDCConnection(connection)
      : connectionAPIController.createSAMLConnection(connection));
    !connection.oidcDiscoveryUrl &&
      idpEnabledConnectionAPIController &&
      (await idpEnabledConnectionAPIController.createSAMLConnection(connection));
    connectionRecords.push(_record);
  }
  return connectionRecords;
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
