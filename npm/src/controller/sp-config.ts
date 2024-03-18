import type { JacksonOption } from '../typings';

import saml20 from '@boxyhq/saml20';
import { getDefaultCertificate } from '../saml/x509';

// Service Provider SSO Configuration
export class SPSSOConfig {
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

  public get oidcRedirectURI(): string {
    return `${this.opts.externalUrl}${this.opts.oidcPath}`;
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

    return saml20.createSPMetadataXML({ entityId, acsUrl, publicKeyString, encryption });
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
