import { DOMParser as Dom } from '@xmldom/xmldom';
import crypto from 'crypto';
import thumbprint from 'thumbprint';
import { promisify } from 'util';
import { SignedXml, xpath as select } from 'xml-crypto';
import xml2js from 'xml2js';
import xmlbuilder from 'xmlbuilder';
import { deflateRaw } from 'zlib';
import * as dbutils from '../db/utils';

import { PubKeyInfo, certToPEM } from '@boxyhq/saml20';
import { JacksonOption, SAMLConfig, SAMLResponsePayload, SLORequestParams, Storable } from '../typings';
import { JacksonError } from './error';
import * as redirect from './oauth/redirect';
import { createRequestForm, IndexNames } from './utils';

const deflateRawAsync = promisify(deflateRaw);

const relayStatePrefix = 'boxyhq_jackson_';
export class LogoutController {
  private configStore: Storable;
  private sessionStore: Storable;
  private opts: JacksonOption;

  constructor({ configStore, sessionStore, opts }) {
    this.opts = opts;
    this.configStore = configStore;
    this.sessionStore = sessionStore;
  }

  // Create SLO Request
  public async createRequest({ nameId, tenant, product, redirectUrl }: SLORequestParams) {
    let samlConfig: SAMLConfig | null = null;

    if (tenant && product) {
      const samlConfigs = await this.configStore.getByIndex({
        name: IndexNames.TenantProduct,
        value: dbutils.keyFromParts(tenant, product),
      });

      if (!samlConfigs || samlConfigs.length === 0) {
        throw new JacksonError('SAML configuration not found.', 403);
      }

      samlConfig = samlConfigs[0];
    }

    if (!samlConfig) {
      throw new JacksonError('SAML configuration not found.', 403);
    }

    const {
      idpMetadata: { slo, provider },
      certs: { privateKey, publicKey },
    } = samlConfig;

    if ('redirectUrl' in slo === false && 'postUrl' in slo === false) {
      throw new JacksonError(`${provider} doesn't support SLO or disabled by IdP.`, 400);
    }

    const { id, xml } = buildRequestXML(nameId, this.opts.samlAudience!, slo.redirectUrl as string);
    const sessionId = crypto.randomBytes(16).toString('hex');

    let logoutUrl: string | null = null;
    let logoutForm: string | null = null;

    const relayState = relayStatePrefix + sessionId;
    const signedXML = await signXML(xml, privateKey, publicKey);

    await this.sessionStore.put(sessionId, {
      id,
      redirectUrl,
    });

    // HTTP-Redirect binding
    if ('redirectUrl' in slo) {
      logoutUrl = redirect.success(slo.redirectUrl as string, {
        SAMLRequest: Buffer.from(await deflateRawAsync(signedXML)).toString('base64'),
        RelayState: relayState,
      });
    }

    // HTTP-POST binding
    if ('postUrl' in slo) {
      logoutForm = createRequestForm(
        relayState,
        encodeURI(Buffer.from(signedXML).toString('base64')),
        slo.postUrl as string
      );
    }

    return { logoutUrl, logoutForm };
  }

  // Handle SLO Response
  public async handleResponse({ SAMLResponse, RelayState }: SAMLResponsePayload) {
    const rawResponse = Buffer.from(SAMLResponse, 'base64').toString();

    const sessionId = RelayState.replace(relayStatePrefix, '');
    const session = await this.sessionStore.get(sessionId);

    if (!session) {
      throw new JacksonError('Unable to validate state from the origin request.', 403);
    }

    const parsedResponse = await parseSAMLResponse(rawResponse);

    if (parsedResponse.status !== 'urn:oasis:names:tc:SAML:2.0:status:Success') {
      throw new JacksonError(`SLO failed with status ${parsedResponse.status}.`, 400);
    }

    if (parsedResponse.inResponseTo !== session.id) {
      throw new JacksonError(`SLO failed with mismatched request ID.`, 400);
    }

    const samlConfigs = await this.configStore.getByIndex({
      name: IndexNames.EntityID,
      value: parsedResponse.issuer,
    });

    if (!samlConfigs || samlConfigs.length === 0) {
      throw new JacksonError('SAML configuration not found.', 403);
    }

    const { idpMetadata, defaultRedirectUrl }: SAMLConfig = samlConfigs[0];

    if (!(await hasValidSignature(rawResponse, idpMetadata.thumbprint))) {
      throw new JacksonError('Invalid signature.', 403);
    }

    try {
      await this.sessionStore.delete(sessionId);
    } catch (_err) {
      // Ignore
    }

    return {
      redirectUrl: session.redirectUrl ?? defaultRedirectUrl,
    };
  }
}

// Create the XML for the SLO Request
const buildRequestXML = (nameId: string, providerName: string, sloUrl: string) => {
  const id = '_' + crypto.randomBytes(10).toString('hex');

  const xml: Record<string, any> = {
    'samlp:LogoutRequest': {
      '@xmlns:samlp': 'urn:oasis:names:tc:SAML:2.0:protocol',
      '@xmlns:saml': 'urn:oasis:names:tc:SAML:2.0:assertion',
      '@ID': id,
      '@Version': '2.0',
      '@IssueInstant': new Date().toISOString(),
      '@Destination': sloUrl,
      'saml:Issuer': {
        '#text': providerName,
      },
      'saml:NameID': {
        '@Format': 'urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified',
        '#text': nameId,
      },
    },
  };

  return {
    id,
    xml: xmlbuilder.create(xml).end({}),
  };
};

// Parse SAMLResponse
const parseSAMLResponse = async (
  rawResponse: string
): Promise<{
  id: string;
  issuer: string;
  status: string;
  destination: string;
  inResponseTo: string;
}> => {
  return new Promise((resolve, reject) => {
    xml2js.parseString(
      rawResponse,
      { tagNameProcessors: [xml2js.processors.stripPrefix] },
      (err: Error, { LogoutResponse }) => {
        if (err) {
          reject(err);
          return;
        }

        resolve({
          issuer: LogoutResponse.Issuer[0]._,
          id: LogoutResponse.$.ID,
          status: LogoutResponse.Status[0].StatusCode[0].$.Value,
          destination: LogoutResponse.$.Destination,
          inResponseTo: LogoutResponse.$.InResponseTo,
        });
      }
    );
  });
};

// Sign the XML
const signXML = async (xml: string, signingKey: string, publicKey: string): Promise<string> => {
  const sig = new SignedXml();

  sig.signatureAlgorithm = 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256';
  sig.keyInfoProvider = new PubKeyInfo(publicKey);
  sig.signingKey = signingKey;

  sig.addReference(
    "/*[local-name(.)='LogoutRequest']",
    ['http://www.w3.org/2000/09/xmldsig#enveloped-signature', 'http://www.w3.org/2001/10/xml-exc-c14n#'],
    'http://www.w3.org/2001/04/xmlenc#sha256'
  );

  sig.computeSignature(xml);

  return sig.getSignedXml();
};

// Validate signature
const hasValidSignature = async (xml: string, certThumbprint: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const doc = new Dom().parseFromString(xml);
    const signed = new SignedXml();
    let calculatedThumbprint;

    const signature =
      select(
        doc,
        "/*/*/*[local-name(.)='Signature' and namespace-uri(.)='http://www.w3.org/2000/09/xmldsig#']"
      )[0] ||
      select(
        doc,
        "/*/*[local-name(.)='Signature' and namespace-uri(.)='http://www.w3.org/2000/09/xmldsig#']"
      )[0] ||
      select(
        doc,
        "/*/*/*/*[local-name(.)='Signature' and namespace-uri(.)='http://www.w3.org/2000/09/xmldsig#']"
      )[0];

    signed.keyInfoProvider = {
      getKey: function getKey(keyInfo) {
        if (certThumbprint) {
          const embeddedSignature = keyInfo[0].getElementsByTagNameNS(
            'http://www.w3.org/2000/09/xmldsig#',
            'X509Certificate'
          );

          if (embeddedSignature.length > 0) {
            const base64cer = embeddedSignature[0].firstChild.toString();

            calculatedThumbprint = thumbprint.calculate(base64cer);

            return certToPEM(base64cer);
          }
        }
      },
      getKeyInfo: function getKeyInfo() {
        return '<X509Data></X509Data>';
      },
    };

    signed.loadSignature(signature.toString());

    try {
      return resolve(
        signed.checkSignature(xml) && calculatedThumbprint.toUpperCase() === certThumbprint.toUpperCase()
      );
    } catch (err) {
      return reject(err);
    }
  });
};
