import saml from '@boxyhq/saml20';
import crypto from 'crypto';
import { promisify } from 'util';
import { deflateRaw } from 'zlib';
import type { SAMLProfile } from '@boxyhq/saml20/dist/typings';

import type { JacksonOption, Storable, SAMLSSORecord, OIDCSSORecord } from '../typings';
import { getDefaultCertificate } from '../saml/x509';
import * as dbutils from '../db/utils';
import { JacksonError } from './error';
import { IndexNames } from './utils';
import { relayStatePrefix } from './utils';
import { createSAMLResponse } from '../saml/lib';

const deflateRawAsync = promisify(deflateRaw);

export class SAMLHandler {
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
    authFlow: 'oauth' | 'saml' | 'idp-initiated';
    originalParams: Record<string, string>;
    tenant?: string;
    product?: string;
    entityId?: string;
    idp_hint?: string;
    samlFedAppId?: string;
  }): Promise<
    | {
        connection: SAMLSSORecord | OIDCSSORecord;
      }
    | {
        redirectUrl: string;
      }
    | {
        postForm: string;
      }
  > {
    const { authFlow, originalParams, tenant, product, idp_hint, entityId, samlFedAppId = '' } = params;

    let connections: (SAMLSSORecord | OIDCSSORecord)[] | null = null;

    // Find SAML connections for the app
    if (tenant && product) {
      connections = (
        await this.connection.getByIndex({
          name: IndexNames.TenantProduct,
          value: dbutils.keyFromParts(tenant, product),
        })
      ).data;
    }

    if (entityId) {
      connections = (
        await this.connection.getByIndex({
          name: IndexNames.EntityID,
          value: entityId,
        })
      ).data;
    }

    const noSSOConnectionErrMessage =
      authFlow === 'oauth' ? 'No SSO connection found.' : 'No SAML connection found.';

    if (!connections || connections.length === 0) {
      throw new JacksonError(noSSOConnectionErrMessage, 404);
    }

    // If an IdP is specified, find the connection for that IdP
    if (idp_hint) {
      const connection = connections.find((c) => c.clientID === idp_hint);

      if (!connection) {
        throw new JacksonError(noSSOConnectionErrMessage, 404);
      }

      return { connection };
    }

    // If more than one, redirect to the connection selection page
    if (connections.length > 1) {
      const url = new URL(`${this.opts.externalUrl}${this.opts.idpDiscoveryPath}`);

      // SP initiated flow
      if (['oauth', 'saml'].includes(authFlow) && tenant && product) {
        const params = new URLSearchParams({
          tenant,
          product,
          authFlow,
          samlFedAppId,
          ...originalParams,
        });

        return { redirectUrl: `${url.toString()}?${params.toString()}` };
      }

      // IdP initiated flow
      if (authFlow === 'idp-initiated' && entityId) {
        const params = new URLSearchParams({
          entityId,
        });

        const postForm = saml.createPostForm(`${this.opts.idpDiscoveryPath}?${params.toString()}`, [
          {
            name: 'SAMLResponse',
            value: originalParams.SAMLResponse,
          },
        ]);

        return { postForm };
      }
    }

    // If only one, use that connection
    return { connection: connections[0] };
  }

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
      samlFederated: true,
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

  createSAMLResponse = async (params: { profile: SAMLProfile; session: any }) => {
    const { profile, session } = params;

    const certificate = await getDefaultCertificate();

    try {
      const responseSigned = await createSAMLResponse({
        audience: session.request.entityId,
        acsUrl: session.request.acsUrl,
        requestId: session.request.id,
        issuer: `${this.opts.samlAudience}`,
        profile,
        ...certificate,
      });

      const responseForm = saml.createPostForm(session.request.acsUrl, [
        {
          name: 'RelayState',
          value: session.request.relayState,
        },
        {
          name: 'SAMLResponse',
          value: Buffer.from(responseSigned).toString('base64'),
        },
      ]);

      return { responseForm };
    } catch (err) {
      // TODO: Instead send saml response with status code
      throw new JacksonError('Unable to validate SAML Response.', 403);
    }
  };
}
