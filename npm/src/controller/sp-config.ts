import type { JacksonOption } from '../typings';
import { marked } from 'marked';

import saml20 from '@boxyhq/saml20';

// Service Provider SAML Configuration
export class SPSAMLConfig {
  constructor(private opts: JacksonOption, private getDefaultCertificate: any) {}

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
    const cert = await this.getDefaultCertificate();

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

  public toHTML(): string {
    return marked.parse(this.toMarkdown());
  }
}

const markdownTemplate = `
## Service Provider (SP) SAML Configuration

Your Identity Provider (IdP) will ask for the following information while configuring the SAML application. Share this information with your IT administrator.

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
