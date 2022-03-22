import crypto from 'crypto';
import xml2js from 'xml2js';
import xmlbuilder from 'xmlbuilder';
import * as dbutils from '../db/utils';
import { JacksonOption, SAMLConfig, SAMLResponsePayload, SLORequestParams, Storable } from '../typings';
import { JacksonError } from './error';
import * as redirect from './oauth/redirect';
import { IndexNames } from './utils';

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

export class LogoutController {
  private configStore: Storable;
  private opts: JacksonOption;

  constructor({ configStore, opts }) {
    this.opts = opts;
    this.configStore = configStore;
  }

  // Create SLO Request
  public async createRequest({ nameId, tenant, product }: SLORequestParams) {
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
    } = samlConfig;

    if ('redirectUrl' in slo === false) {
      throw new JacksonError(`${provider} doesn't support SLO.`, 400);
    }

    // TODO: Need to support HTTP-POST binding

    const { id, xml } = buildRequestXML(nameId, this.opts.samlAudience, slo.redirectUrl as string);

    return redirect.success(slo.redirectUrl as string, {
      SAMLRequest: Buffer.from(xml).toString('base64'),
    });
  }

  // Handle SLO Response
  public async handleResponse({ SAMLResponse, RelayState }: SAMLResponsePayload) {
    const rawResponse = Buffer.from(SAMLResponse, 'base64').toString();

    // TODO: Validate the signature
    // TODO: Validate the RelayState

    try {
      const parsedResponse = await parseSAMLResponse(rawResponse);

      if (parsedResponse.status !== 'urn:oasis:names:tc:SAML:2.0:status:Success') {
        throw new JacksonError(`SLO failed with status ${parsedResponse.status}.`, 400);
      }

      return parsedResponse;
    } catch (e) {
      console.log(e);
    }
  }
}
