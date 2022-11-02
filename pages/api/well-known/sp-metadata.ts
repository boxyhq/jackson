import type { NextApiRequest, NextApiResponse } from 'next';
import jackson from '@lib/jackson';
import xmlbuilder from 'xmlbuilder';

const createSSOMetadataXML = async ({
  entityId,
  acsUrl,
}: //certificate,
{
  entityId: string;
  acsUrl: string;
  //certificate: string;
}): Promise<string> => {
  // certificate = saml.stripCertHeaderAndFooter(certificate);

  const today = new Date();

  const nodes = {
    'md:EntityDescriptor': {
      '@xmlns:md': 'urn:oasis:names:tc:SAML:2.0:metadata',
      '@entityID': entityId,
      '@validUntil': new Date(today.setFullYear(today.getFullYear() + 10)).toISOString(),
      'md:SPSSODescriptor': {
        //'@WantAuthnRequestsSigned': true,
        '@protocolSupportEnumeration': 'urn:oasis:names:tc:SAML:2.0:protocol',
        // 'md:KeyDescriptor': {
        //   '@use': 'signing',
        //   'ds:KeyInfo': {
        //     '@xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#',
        //     'ds:X509Data': {
        //       'ds:X509Certificate': {
        //         '#text': certificate,
        //       },
        //     },
        //   },
        // },
        'md:NameIDFormat': {
          '#text': 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
        },
        'md:AssertionConsumerService': {
          '@index': 1,
          '@Binding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
          '@Location': acsUrl,
        },
      },
    },
  };

  return xmlbuilder.create(nodes, { encoding: 'UTF-8', standalone: false }).end({ pretty: true });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    throw { message: 'Method not allowed', statusCode: 405 };
  }
  const { spConfig } = await jackson();

  const config = spConfig.get();

  const xml = await createSSOMetadataXML({ entityId: config.entityId, acsUrl: config.acsUrl });
  res.status(200).setHeader('Content-Type', 'text/xml').send(xml);
}
