import type { DirectorySync, JacksonOption } from './typings';
import DB from './db/db';
import defaultDb from './db/defaultDb';
import loadConnection from './loadConnection';
import { AdminController } from './controller/admin';
import { ConnectionAPIController } from './controller/api';
import { OAuthController } from './controller/oauth';
import { HealthCheckController } from './controller/health-check';
import { LogoutController } from './controller/logout';
import initDirectorySync from './directory-sync';
import { OidcDiscoveryController } from './controller/oidc-discovery';
import { SPSAMLConfig } from './controller/sp-config';
import * as x509 from './saml/x509';
import initSAMLFederation, { type SAMLFederation } from './saml-federation';

const defaultOpts = (opts: JacksonOption): JacksonOption => {
  const newOpts = {
    ...opts,
  };

  if (!newOpts.externalUrl) {
    throw new Error('externalUrl is required');
  }

  if (!newOpts.samlPath) {
    throw new Error('samlPath is required');
  }

  newOpts.scimPath = newOpts.scimPath || '/api/scim/v2.0';

  newOpts.samlAudience = newOpts.samlAudience || 'https://saml.boxyhq.com';
  // path to folder containing static IdP connections that will be preloaded. This is useful for self-hosted deployments that only have to support a single tenant (or small number of known tenants).
  newOpts.preLoadedConnection = newOpts.preLoadedConnection || '';
  newOpts.preLoadedConfig = newOpts.preLoadedConfig || ''; // for backwards compatibility

  newOpts.idpEnabled = newOpts.idpEnabled === true;
  defaultDb(newOpts);

  newOpts.clientSecretVerifier = newOpts.clientSecretVerifier || 'dummy';
  newOpts.db.pageLimit = newOpts.db.pageLimit || 50;

  newOpts.openid = newOpts.openid || {};
  newOpts.openid.jwsAlg = newOpts.openid.jwsAlg || 'RS256';

  return newOpts;
};

export const controllers = async (
  opts: JacksonOption
): Promise<{
  apiController: ConnectionAPIController;
  connectionAPIController: ConnectionAPIController;
  oauthController: OAuthController;
  adminController: AdminController;
  logoutController: LogoutController;
  healthCheckController: HealthCheckController;
  directorySync: DirectorySync;
  oidcDiscoveryController: OidcDiscoveryController;
  spConfig: SPSAMLConfig;
  samlFederated: SAMLFederation;
}> => {
  opts = defaultOpts(opts);

  const db = await DB.new(opts.db);

  const connectionStore = db.store('saml:config');
  const sessionStore = db.store('oauth:session', opts.db.ttl);
  const codeStore = db.store('oauth:code', opts.db.ttl);
  const tokenStore = db.store('oauth:token', opts.db.ttl);
  const healthCheckStore = db.store('_health:check');
  const certificateStore = db.store('x509:certificates');

  const connectionAPIController = new ConnectionAPIController({ connectionStore, opts });
  const adminController = new AdminController({ connectionStore });
  const healthCheckController = new HealthCheckController({ healthCheckStore });
  await healthCheckController.init();

  // Create default certificate if it doesn't exist.
  await x509.init(certificateStore);

  const oauthController = new OAuthController({
    connectionStore,
    sessionStore,
    codeStore,
    tokenStore,
    opts,
  });

  const logoutController = new LogoutController({
    connectionStore,
    sessionStore,
    opts,
  });

  const directorySync = await initDirectorySync({ db, opts });

  const oidcDiscoveryController = new OidcDiscoveryController({ opts });

  const spConfig = new SPSAMLConfig(opts, x509.getDefaultCertificate);

  const samlFederated = await initSAMLFederation({ db, opts });

  // write pre-loaded connections if present
  const preLoadedConnection = opts.preLoadedConnection || opts.preLoadedConfig;
  if (preLoadedConnection && preLoadedConnection.length > 0) {
    const connections = await loadConnection(preLoadedConnection);

    for (const connection of connections) {
      if ('oidcDiscoveryUrl' in connection) {
        await connectionAPIController.createOIDCConnection(connection);
      } else {
        await connectionAPIController.createSAMLConnection(connection);
      }

      console.info(`loaded connection for tenant "${connection.tenant}" and product "${connection.product}"`);
    }
  }

  const type = opts.db.engine === 'sql' && opts.db.type ? ' Type: ' + opts.db.type : '';

  console.info(`Using engine: ${opts.db.engine}.${type}`);

  return {
    spConfig,
    apiController: connectionAPIController,
    connectionAPIController,
    oauthController,
    adminController,
    logoutController,
    healthCheckController,
    directorySync,
    oidcDiscoveryController,
    samlFederated,
  };
};

export default controllers;

export * from './typings';

export type { SAMLFederation };
