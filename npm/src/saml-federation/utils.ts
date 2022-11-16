import xmlbuilder from 'xmlbuilder';
import saml from '@boxyhq/saml20';
import xml2js from 'xml2js';
import { inflateRaw } from 'zlib';
import { promisify } from 'util';
import crypto from 'crypto';

import claims from '../saml/claims';
import { SAMLProfile } from '@boxyhq/saml20/dist/typings';

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

// Parse SAMLRequest attributes
export const extractSAMLRequestAttributes = async (request: string) => {
  const result = await parseXML(request);

  const attributes = result['samlp:AuthnRequest']['$'];
  const issuer = result['samlp:AuthnRequest']['saml:Issuer'];

  const publicKey = result['samlp:AuthnRequest']['Signature']
    ? result['samlp:AuthnRequest']['Signature'][0]['KeyInfo'][0]['X509Data'][0]['X509Certificate'][0]
    : null;

  // if (!publicKey) {
  //   throw new Error('Missing signature');
  // }

  return {
    id: attributes.ID,
    acsUrl: attributes.AssertionConsumerServiceURL,
    providerName: attributes.ProviderName,
    audience: issuer[0],
    publicKey,
  };
};

// Parse SAMLResponse attributes
export const extractSAMLResponseAttributes = async (response: string, validateOpts) => {
  const attributes = await saml.validate(response, validateOpts);

  if (attributes && attributes.claims) {
    // We map claims to our attributes id, email, firstName, lastName where possible. We also map original claims to raw
    attributes.claims = claims.map(attributes.claims);

    // Some providers don't return the id in the assertion, we set it to a sha256 hash of the email
    if (!attributes.claims.id && attributes.claims.email) {
      attributes.claims.id = crypto.createHash('sha256').update(attributes.claims.email).digest('hex');
    }
  }

  return attributes;
};

const randomId = () => {
  return '_' + crypto.randomBytes(10).toString('hex');
};

export const createSAMLResponses = async ({
  audience,
  issuer,
  acsUrl,
  profile,
  requestId,
}: {
  audience: string;
  issuer: string;
  acsUrl: string;
  profile: SAMLProfile;
  requestId: string;
}): Promise<string> => {
  const authDate = new Date();
  const authTimestamp = authDate.toISOString();

  authDate.setMinutes(authDate.getMinutes() - 5);
  const notBefore = authDate.toISOString();

  authDate.setMinutes(authDate.getMinutes() + 10);
  const notAfter = authDate.toISOString();

  console.log({ profile });

  const attributeStatement = {
    '@xmlns:xs': 'http://www.w3.org/2001/XMLSchema',
    '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
    'saml:Attribute': [
      {
        '@Name': 'id',
        '@NameFormat': 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
        'saml:AttributeValue': {
          '@xmlns:xs': 'http://www.w3.org/2001/XMLSchema',
          '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
          '@xsi:type': 'xs:string',
          '#text': profile.claims.id,
        },
      },
      {
        '@Name': 'email',
        '@NameFormat': 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
        'saml:AttributeValue': {
          '@xmlns:xs': 'http://www.w3.org/2001/XMLSchema',
          '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
          '@xsi:type': 'xs:string',
          '#text': profile.claims.email,
        },
      },
      {
        '@Name': 'full_name',
        '@NameFormat': 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
        'saml:AttributeValue': {
          '@xmlns:xs': 'http://www.w3.org/2001/XMLSchema',
          '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
          '@xsi:type': 'xs:string',
          '#text': `${profile.claims.firstName} ${profile.claims.lastName}`,
        },
      },
      {
        '@Name': 'roles',
        '@NameFormat': 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
        'saml:AttributeValue': [
          {
            '@xmlns:xs': 'http://www.w3.org/2001/XMLSchema',
            '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
            '@xsi:type': 'xs:string',
            '#text': 'agent',
          },
        ],
      },
      {
        '@Name': 'firstName',
        '@NameFormat': 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
        'saml:AttributeValue': {
          '@xmlns:xs': 'http://www.w3.org/2001/XMLSchema',
          '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
          '@xsi:type': 'xs:string',
          '#text': profile.claims.firstName,
        },
      },
      {
        '@Name': 'lastName',
        '@NameFormat': 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
        'saml:AttributeValue': {
          '@xmlns:xs': 'http://www.w3.org/2001/XMLSchema',
          '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
          '@xsi:type': 'xs:string',
          '#text': profile.claims.lastName,
        },
      },
    ],
  };

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
        'saml:AttributeStatement': attributeStatement,
      },
    },
  };

  return xmlbuilder.create(nodes, { encoding: 'UTF-8' }).end();
};

export const signSAMLResponse = async (xml: string, signingKey: string, publicKey: string) => {
  const responseXPath =
    '/*[local-name(.)="Response" and namespace-uri(.)="urn:oasis:names:tc:SAML:2.0:protocol"]';

  return await saml.sign(xml, signingKey, publicKey, responseXPath);
};
