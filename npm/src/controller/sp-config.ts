import type { JacksonOption } from '../typings';

import saml20 from '@boxyhq/saml20';
import xmlbuilder from 'xmlbuilder';
import { getDefaultCertificate } from '../saml/x509';

// Service Provider SAML Configuration
export class SPSAMLConfig {
  constructor(private opts: JacksonOption) {}

  private get acsUrl(): string {
    return `${this.opts.externalUrl}${this.opts.samlPath}`;
  }

  private get entityId(): string {
    return `${this.opts.samlAudience}`;
  }

  private get responseSigned(): string {
    return 'Signed';
  }

  private get assertionSignature(): string {
    return 'Signed';
  }

  private get signatureAlgorithm(): string {
    return 'RSA-SHA256';
  }

  public async get(): Promise<{
    acsUrl: string;
    entityId: string;
    response: string;
    assertionSignature: string;
    signatureAlgorithm: string;
    publicKey: string;
    publicKeyString: string;
  }> {
    const cert = await getDefaultCertificate();

    return {
      acsUrl: this.acsUrl,
      entityId: this.entityId,
      response: this.responseSigned,
      assertionSignature: this.assertionSignature,
      signatureAlgorithm: this.signatureAlgorithm,
      publicKey: cert.publicKey,
      publicKeyString: saml20.stripCertHeaderAndFooter(cert.publicKey),
    };
  }

  public toMarkdown(): string {
    return markdownTemplate
      .replace('{{acsUrl}}', this.acsUrl)
      .replace('{{entityId}}', this.entityId)
      .replace('{{responseSigned}}', this.responseSigned)
      .replace('{{assertionSignature}}', this.assertionSignature)
      .replace('{{signatureAlgorithm}}', this.signatureAlgorithm);
  }

  public async toXMLMetadata(encryption = false): Promise<string> {
    const { entityId, acsUrl, publicKeyString } = await this.get();

    const today = new Date();

    const keyDescriptor: any[] = [
      {
        '@use': 'signing',
        'ds:KeyInfo': {
          '@xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#',
          'ds:X509Data': {
            'ds:X509Certificate': {
              '#text': publicKeyString,
            },
          },
        },
      },
    ];

    if (encryption) {
      keyDescriptor.push({
        '@use': 'encryption',
        'ds:KeyInfo': {
          '@xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#',
          'ds:X509Data': {
            'ds:X509Certificate': {
              '#text': publicKeyString,
            },
          },
        },
        'md:EncryptionMethod': {
          '@Algorithm': 'http://www.w3.org/2001/04/xmlenc#aes256-cbc',
        },
      });
    }

    const nodes = {
      'md:EntityDescriptor': {
        '@xmlns:md': 'urn:oasis:names:tc:SAML:2.0:metadata',
        '@entityID': entityId,
        '@validUntil': new Date(today.setFullYear(today.getFullYear() + 10)).toISOString(),
        'md:SPSSODescriptor': {
          //'@WantAuthnRequestsSigned': true,
          '@protocolSupportEnumeration': 'urn:oasis:names:tc:SAML:2.0:protocol',
          'md:KeyDescriptor': keyDescriptor,
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
  }
}

const markdownTemplate = `
## Service Provider (SP) SAML Configuration

Your Identity Provider (IdP) will ask for the following information while configuring the SAML application. Share this information with your IT administrator.

For provider specific instructions, refer to our <a href="https://boxyhq.com/docs/jackson/sso-providers" target="_blank">guides</a>

**ACS (Assertion Consumer Service) URL / Single Sign-On URL / Destination URL** <br />
{{acsUrl}}

**SP Entity ID / Identifier / Audience URI / Audience Restriction** <br />
{{entityId}}

**Response** <br />
{{responseSigned}}

**Assertion Signature** <br />
{{assertionSignature}}

**Signature Algorithm** <br />
{{signatureAlgorithm}}

**Assertion Encryption** <br />
If you want to encrypt the assertion, you can download our [public certificate](/.well-known/saml.cer). Otherwise select the 'Unencrypted' option.
`;
