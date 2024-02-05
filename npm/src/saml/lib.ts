import crypto from 'crypto';
import saml from '@boxyhq/saml20';
import xmlbuilder from 'xmlbuilder';
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

export type ValidateOption = {
  thumbprint?: string;
  publicKey?: string;
  audience: string;
  privateKey: string;
  inResponseTo?: string;
};
