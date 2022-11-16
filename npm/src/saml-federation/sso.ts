import saml from '@boxyhq/saml20';

import type { SAMLConnection, SAMLFederationApp } from '../typings';
import { App } from './app';
import { promisify } from 'util';
import { deflateRaw } from 'zlib';
import * as dbutils from '../db/utils';
import { IndexNames } from '../controller/utils';
import { JacksonError } from '../controller/error';
import { getDefaultCertificate } from '../saml/x509';
import {
  decodeBase64,
  extractSAMLRequestAttributes,
  extractSAMLResponseAttributes,
  createSAMLResponses,
  signSAMLResponse,
} from './utils';
import { SAMLProfile } from '@boxyhq/saml20/dist/typings';

const deflateRawAsync = promisify(deflateRaw);

export class SSOHandler {
  private app: App;
  private session: any;
  private connection: any;

  constructor({ app, sessionStore, connectionStore }: { app: App; sessionStore: any; connectionStore: any }) {
    this.app = app;
    this.session = sessionStore;
    this.connection = connectionStore;
  }

  public handleSAMLRequest = async ({
    appId,
    request,
    relayState,
  }: {
    appId: string;
    request: string;
    relayState: string;
  }) => {
    const { data: app } = await this.app.get(appId);

    const attributes = await extractSAMLRequestAttributes(await decodeBase64(request, true));

    // TODO: Validate the SAML Request

    const requestSession = {
      app,
      request: {
        ...attributes,
        relayState,
      },
    };

    return await this.createSAMLRequest(requestSession);
  };

  public createSAMLRequest = async (requestSession: SPRequestSession) => {
    const { app, request: spRequest } = requestSession;

    const certificate = await getDefaultCertificate();

    // Create a new session to store SP request information
    await this.session.put(spRequest.relayState, requestSession);

    // Find SAML connections for the app
    const connections = await this.connection.getByIndex({
      name: IndexNames.TenantProduct,
      value: dbutils.keyFromParts(app.tenant, app.product),
    });

    // Assume there is only one connection exists for now
    const connection = connections[0];

    // Create SAML Request
    const samlRequest = saml.request({
      ssoUrl: connection.idpMetadata.sso.redirectUrl,
      entityID: 'https://saml.boxyhq.com',
      callbackUrl: `https://f4d4-103-147-208-109.in.ngrok.io/api/saml-federation/${app.id}/acs`,
      signingKey: certificate.privateKey,
      publicKey: certificate.publicKey,
    });

    // We're reusing the RelayState coming from SP's SAML Request
    const url = new URL(connection.idpMetadata.sso.redirectUrl);

    url.searchParams.set('RelayState', spRequest.relayState);
    url.searchParams.set(
      'SAMLRequest',
      Buffer.from(await deflateRawAsync(samlRequest.request)).toString('base64')
    );

    return { data: { url: url.href } };
  };

  public handleSAMLResponse = async ({
    appId,
    response,
    relayState,
  }: {
    appId: string;
    response: string;
    relayState: string;
  }) => {
    await this.app.get(appId);

    const requestSession = await this.session.get(relayState);

    if (!requestSession) {
      throw new JacksonError('Unable to validate state from the origin request.', 404);
    }

    const decodedResponse = Buffer.from(response, 'base64').toString();

    const issuer = saml.parseIssuer(decodedResponse);

    if (!issuer) {
      throw new JacksonError('Issuer not found.', 403);
    }

    // Find SAML connections for the app
    const connections: SAMLConnection[] = await this.connection.getByIndex({
      name: IndexNames.EntityID,
      value: issuer,
    });

    if (connections.length === 0) {
      throw new JacksonError('No SAML connection found.', 404);
    }

    const connection = connections[0];
    const certificate = await getDefaultCertificate();

    try {
      const attributes = await extractSAMLResponseAttributes(decodedResponse, {
        thumbprint: connection.idpMetadata.thumbprint,
        audience: 'https://saml.boxyhq.com',
        privateKey: certificate.privateKey,
      });

      return {
        data: {
          session: requestSession,
          attributes,
        },
      };
    } catch (err) {
      throw new JacksonError('Unable to validate SAML Response.', 403);
    }
  };

  public createSAMLResponse = async ({
    session,
    attributes,
  }: {
    session: SPRequestSession;
    attributes: SAMLProfile;
  }) => {
    const { request: spRequest } = session;

    console.log({ session, attributes });
    // return;

    const certificate = await getDefaultCertificate();

    const xml = await createSAMLResponses({
      audience: spRequest.audience,
      acsUrl: spRequest.acsUrl,
      issuer: 'https://saml.boxyhq.com',
      profile: {
        ...attributes,
      },
      requestId: spRequest.id,
    });

    const xmlSigned = await signSAMLResponse(xml, certificate.privateKey, certificate.publicKey);

    const htmlForm = saml.createPostForm(spRequest.acsUrl, [
      {
        name: 'RelayState',
        value: spRequest.relayState,
      },
      {
        name: 'SAMLResponse',
        value: Buffer.from(xmlSigned).toString('base64'),
      },
    ]);

    return { data: { htmlForm } };
  };
}

type SPRequestSession = {
  app: SAMLFederationApp;
  request: {
    id: string;
    acsUrl: string;
    providerName: string;
    audience: string;
    publicKey: string | null;
    relayState: string;
  };
};

//ACS URL: https://f4d4-103-147-208-109.in.ngrok.io/api/saml-federation/5aabcd41eabf1e97de17d3acf9a6d7e1172ea8ae/acs
// SSO URL: https://flex.twilio.com/cadet-raven-5421
