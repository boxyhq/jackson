import xmlbuilder from 'xmlbuilder';
import saml from '@boxyhq/saml20';

import type { SAMLFederationAppWithMetadata } from '../typings';

// Create Metadata XML
export const createMetadataXML = async ({
  ssoUrl,
  entityId,
  certificate,
}: {
  ssoUrl: string;
  entityId: string;
  certificate: string;
}): Promise<Pick<SAMLFederationAppWithMetadata, 'metadata'>['metadata']> => {
  certificate = saml.stripCertHeaderAndFooter(certificate);

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
                '#text': certificate,
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

  const xml = xmlbuilder.create(nodes, { encoding: 'UTF-8', standalone: false }).end({ pretty: true });

  return {
    xml,
    entityId,
    ssoUrl,
    x509cert: certificate,
  };
};
