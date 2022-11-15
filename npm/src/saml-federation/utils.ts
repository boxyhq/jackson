import xmlbuilder from 'xmlbuilder';
import saml from '@boxyhq/saml20';
import xml2js from 'xml2js';
import { inflateRaw } from 'zlib';
import { promisify } from 'util';

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

// Parse SAMLRequest attributes
export const extractSAMLRequestAttributes = async (request: string) => {
  console.log(request);

  const result = await parseXML(request);

  console.log(result);

  const attributes = result['samlp:AuthnRequest']['$'];
  const issuer = result['samlp:AuthnRequest']['saml:Issuer'];

  const publicKey = result['samlp:AuthnRequest']['Signature']
    ? result['samlp:AuthnRequest']['Signature'][0]['KeyInfo'][0]['X509Data'][0]['X509Certificate'][0]
    : null;

  if (!publicKey) {
    throw new Error('Missing signature');
  }

  return {
    id: attributes.ID,
    acsUrl: attributes.AssertionConsumerServiceURL,
    providerName: attributes.ProviderName,
    audience: issuer[0]['_'],
    publicKey,
  };
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
