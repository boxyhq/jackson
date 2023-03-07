import crypto from 'crypto';
import xml2js from 'xml2js';
import { inflateRaw } from 'zlib';
import { promisify } from 'util';
import saml from '@boxyhq/saml20';
import xmlbuilder from 'xmlbuilder';
import type { SAMLProfile } from '@boxyhq/saml20/dist/typings';
import * as dbutils from '../db/utils';
import claims from '../saml/claims';

// Validate the SAMLResponse and extract the user profile
export const extractSAMLResponseAttributes = async (
  decodedResponse: string,
  validateOpts: ValidateOption
) => {
  const attributes = await saml.validate(decodedResponse, validateOpts);

  if (attributes && attributes.claims) {
    // We map claims to our attributes id, email, firstName, lastName where possible. We also map original claims to raw
    attributes.claims = claims.map(attributes.claims);

    // Some providers don't return the id in the assertion, we set it to a sha256 hash of the email
    if (!attributes.claims.id && attributes.claims.email) {
      attributes.claims.id = crypto.createHash('sha256').update(attributes.claims.email).digest('hex');
    }
  }

  // we'll send a ripemd160 hash of the id, this can be used in the case of email missing it can be used as the local part
  attributes.claims.idHash = dbutils.keyDigest(attributes.claims.id);

  return attributes;
};

export const extractSAMLRequestAttributes = async (samlRequest: string) => {
  const decodedRequest = await decodeBase64(samlRequest, true);
  const result = await parseXML(decodedRequest);

  const publicKey: string = result['samlp:AuthnRequest']['Signature']
    ? result['samlp:AuthnRequest']['Signature'][0]['KeyInfo'][0]['X509Data'][0]['X509Certificate'][0]
    : null;

  const attributes = result['samlp:AuthnRequest']['$'];

  const id: string = attributes.ID;
  const providerName: string = attributes.ProviderName;
  const acsUrl: string = attributes.AssertionConsumerServiceURL;
  const entityId: string = result['samlp:AuthnRequest']['saml:Issuer'][0];

  if (!entityId) {
    throw new Error("Missing 'Entity ID' in SAML Request.");
  }

  if (!acsUrl) {
    throw new Error("Missing 'ACS URL' in SAML Request.");
  }

  return {
    id,
    acsUrl,
    entityId,
    publicKey,
    providerName,
    decodedRequest,
  };
};

// Create Metadata XML
export const createMetadataXML = async ({
  ssoUrl,
  entityId,
  x509cert,
}: {
  ssoUrl: string;
  entityId: string;
  x509cert: string;
}): Promise<string> => {
  x509cert = saml.stripCertHeaderAndFooter(x509cert);

  const today = new Date();
  const nodes = {
    'md:EntityDescriptor': {
      '@xmlns:md': 'urn:oasis:names:tc:SAML:2.0:metadata',
      '@entityID': entityId,
      '@validUntil': new Date(today.setFullYear(today.getFullYear() + 10)).toISOString(),
      'md:IDPSSODescriptor': {
        '@WantAuthnRequestsSigned': false,
        '@protocolSupportEnumeration': 'urn:oasis:names:tc:SAML:2.0:protocol',
        'md:KeyDescriptor': {
          '@use': 'signing',
          'ds:KeyInfo': {
            '@xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#',
            'ds:X509Data': {
              'ds:X509Certificate': {
                '#text': x509cert,
              },
            },
          },
        },
        'md:NameIDFormat': {
          '#text': 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
        },
        'md:SingleSignOnService': [
          {
            '@Binding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
            '@Location': ssoUrl,
          },
          {
            '@Binding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
            '@Location': ssoUrl,
          },
        ],
      },
    },
  };

  return xmlbuilder.create(nodes, { encoding: 'UTF-8', standalone: false }).end({ pretty: true });
};

// Decode the base64 string
export const decodeBase64 = async (string: string, isDeflated: boolean) => {
  const inflateRawAsync = promisify(inflateRaw);

  return isDeflated
    ? (await inflateRawAsync(Buffer.from(string, 'base64'))).toString()
    : Buffer.from(string, 'base64').toString();
};

// Parse XML
const parseXML = async (xml: string): Promise<Record<string, string>> => {
  return new Promise((resolve, reject) => {
    xml2js.parseString(xml, (err: Error | null, result: any) => {
      if (err) {
        reject(err);
      }

      resolve(result);
    });
  });
};

const randomId = () => {
  return '_' + crypto.randomBytes(10).toString('hex');
};

// Create SAML Response and sign it
export const createSAMLResponse = async ({
  audience,
  issuer,
  acsUrl,
  profile,
  requestId,
  privateKey,
  publicKey,
}: {
  audience: string;
  issuer: string;
  acsUrl: string;
  profile: SAMLProfile;
  requestId: string;
  privateKey: string;
  publicKey: string;
}): Promise<string> => {
  const authDate = new Date();
  const authTimestamp = authDate.toISOString();

  authDate.setMinutes(authDate.getMinutes() - 5);
  const notBefore = authDate.toISOString();

  authDate.setMinutes(authDate.getMinutes() + 10);
  const notAfter = authDate.toISOString();

  const nodes = {
    'samlp:Response': {
      '@xmlns:samlp': 'urn:oasis:names:tc:SAML:2.0:protocol',
      '@Version': '2.0',
      '@ID': randomId(),
      '@Destination': acsUrl,
      '@InResponseTo': requestId,
      '@IssueInstant': authTimestamp,
      'saml:Issuer': {
        '@xmlns:saml': 'urn:oasis:names:tc:SAML:2.0:assertion',
        '@Format': 'urn:oasis:names:tc:SAML:2.0:assertion',
        '#text': issuer,
      },
      'samlp:Status': {
        'samlp:StatusCode': {
          '@Value': 'urn:oasis:names:tc:SAML:2.0:status:Success',
        },
      },
      'saml:Assertion': {
        '@xmlns:saml': 'urn:oasis:names:tc:SAML:2.0:assertion',
        '@Version': '2.0',
        '@ID': randomId(),
        '@IssueInstant': authTimestamp,
        'saml:Issuer': {
          '#text': issuer,
        },
        'saml:Subject': {
          '@xmlns:saml': 'urn:oasis:names:tc:SAML:2.0:assertion',
          'saml:NameID': {
            '@Format': 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
            '#text': profile.claims.email,
          },
          'saml:SubjectConfirmation': {
            '@Method': 'urn:oasis:names:tc:SAML:2.0:cm:bearer',
            'saml:SubjectConfirmationData': {
              '@Recipient': acsUrl,
              '@NotOnOrAfter': notAfter,
              '@InResponseTo': requestId,
            },
          },
        },
        'saml:Conditions': {
          '@NotBefore': notBefore,
          '@NotOnOrAfter': notAfter,
          'saml:AudienceRestriction': {
            'saml:Audience': {
              '#text': audience,
            },
          },
        },
        'saml:AuthnStatement': {
          '@AuthnInstant': authTimestamp,
          '@SessionIndex': '_YIlFoNFzLMDYxdwf-T_BuimfkGa5qhKg',
          'saml:AuthnContext': {
            'saml:AuthnContextClassRef': {
              '#text': 'urn:oasis:names:tc:SAML:2.0:ac:classes:unspecified',
            },
          },
        },
        'saml:AttributeStatement': {
          '@xmlns:xs': 'http://www.w3.org/2001/XMLSchema',
          '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
          'saml:Attribute': Object.keys(profile.claims.raw).map((attributeName) => {
            return {
              '@Name': attributeName,
              '@NameFormat': 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
              'saml:AttributeValue': {
                '@xmlns:xs': 'http://www.w3.org/2001/XMLSchema',
                '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
                '@xsi:type': 'xs:string',
                '#text': profile.claims.raw[attributeName],
              },
            };
          }),
        },
      },
    },
  };

  const xml = xmlbuilder.create(nodes, { encoding: 'UTF-8' }).end();

  return await saml.sign(
    xml,
    privateKey,
    publicKey,
    '/*[local-name(.)="Response" and namespace-uri(.)="urn:oasis:names:tc:SAML:2.0:protocol"]'
  );
};

type ValidateOption = {
  thumbprint: string;
  audience: string;
  privateKey: string;
  inResponseTo?: string;
};
