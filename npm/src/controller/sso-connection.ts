import saml from '@boxyhq/saml20';
import crypto from 'crypto';
import { promisify } from 'util';
import { deflateRaw } from 'zlib';

import type { JacksonOption, Storable, SAMLSSORecord, OIDCSSORecord } from '../typings';
import { getDefaultCertificate } from '../saml/x509';
import * as dbutils from '../db/utils';
import { JacksonError } from './error';
import { IndexNames } from './utils';

const deflateRawAsync = promisify(deflateRaw);

// Used to identify the relay state as a federated SAML request
const relayStatePrefix = 'federated_saml_';

export class SSOConnection {
  private connection: Storable;
  private session: Storable;
  private opts: JacksonOption;

  constructor({
    connection,
    session,
    opts,
  }: {
    connection: Storable;
    session: Storable;
    opts: JacksonOption;
  }) {
    this.connection = connection;
    this.session = session;
    this.opts = opts;
  }

  // If there are multiple connections for the given tenant and product, return the url to the IdP selection page
  // If idp_hint is provided, return the connection with the matching clientID
  // If there is only one connection, return the connection
  async resolveConnection(params: {
    tenant: string;
    product: string;
    authFlow: 'oauth' | 'saml';
    idp_hint?: string;
    originalParams: Record<string, string>;
  }): Promise<
    | { redirectUrl: string; connection: null }
    | { redirectUrl: null; connection: SAMLSSORecord | OIDCSSORecord }
  > {
    const { tenant, product, idp_hint, authFlow, originalParams } = params;

    // Find SAML connections for the app
    const connections: (SAMLSSORecord | OIDCSSORecord)[] = await this.connection.getByIndex({
      name: IndexNames.TenantProduct,
      value: dbutils.keyFromParts(tenant, product),
    });

    if (!connections || connections.length === 0) {
      throw new JacksonError('No SAML connection found.', 404);
    }

    // If an IdP is specified, find the connection for that IdP
    if (idp_hint) {
      const connection = connections.find((c) => c.clientID === idp_hint);

      if (!connection) {
        throw new JacksonError('No SAML connection found.', 404);
      }

      return { redirectUrl: null, connection };
    }

    // If more than one, redirect to the connection selection page
    if (connections.length > 1) {
      const url = new URL(`${this.opts.externalUrl}${this.opts.idpDiscoveryPath}`);

      const params = new URLSearchParams({
        tenant,
        product,
        authFlow,
        ...originalParams,
      });

      return { redirectUrl: `${url.toString()}?${params.toString()}`, connection: null };
    }

    // If only one, use that connection
    return { redirectUrl: null, connection: connections[0] };
  }

  // Create SAML Request using the provided connection and return the url to the IdP
  async createSAMLRequest(params: {
    connection: SAMLSSORecord;
    requestParams: Record<string, any>;
  }): Promise<{ redirectUrl: string }> {
    const { connection, requestParams } = params;

    // We have a connection now, so we can create the SAML request
    const certificate = await getDefaultCertificate();

    const samlRequest = saml.request({
      ssoUrl: connection.idpMetadata.sso.redirectUrl,
      entityID: `${this.opts.samlAudience}`,
      callbackUrl: `${this.opts.externalUrl}/api/oauth/saml`,
      signingKey: certificate.privateKey,
      publicKey: certificate.publicKey,
    });

    // Create a new session to store SP request information
    const sessionId = crypto.randomBytes(16).toString('hex');

    await this.session.put(sessionId, {
      id: samlRequest.id,
      request: {
        ...requestParams,
      },
    });

    // Create URL to redirect to the Identity Provider
    const url = new URL(`${connection.idpMetadata.sso.redirectUrl}`);

    url.searchParams.set('RelayState', `${relayStatePrefix}${sessionId}`);
    url.searchParams.set(
      'SAMLRequest',
      Buffer.from(await deflateRawAsync(samlRequest.request)).toString('base64')
    );

    return {
      redirectUrl: url.toString(),
    };
  }
}
