import saml from '@boxyhq/saml20';
import crypto from 'crypto';
import * as rambda from 'rambda';
import thumbprint from 'thumbprint';
import xmlcrypto from 'xml-crypto';
import xml2js from 'xml2js';
import xmlbuilder from 'xmlbuilder';
import { SAMLProfile, SAMLReq } from '../typings';
import claims from './claims';

const idPrefix = '_';
const authnXPath =
  '/*[local-name(.)="AuthnRequest" and namespace-uri(.)="urn:oasis:names:tc:SAML:2.0:protocol"]';
const issuerXPath = '/*[local-name(.)="Issuer" and namespace-uri(.)="urn:oasis:names:tc:SAML:2.0:assertion"]';

export const stripCertHeaderAndFooter = (cert: string): string => {
  cert = cert.replace(/-+BEGIN CERTIFICATE-+\r?\n?/, '');
  cert = cert.replace(/-+END CERTIFICATE-+\r?\n?/, '');
  cert = cert.replace(/\r\n/g, '\n');
  return cert;
};

function PubKeyInfo(this: any, pubKey: string) {
  this.pubKey = stripCertHeaderAndFooter(pubKey);

  this.getKeyInfo = function (_key, prefix) {
    prefix = prefix || '';
    prefix = prefix ? prefix + ':' : prefix;
    return `<${prefix}X509Data><${prefix}X509Certificate>${this.pubKey}</${prefix}X509Certificate</${prefix}X509Data>`;
  };
}

const signRequest = (xml: string, signingKey: string, publicKey: string) => {
  if (!xml) {
    throw new Error('Please specify xml');
  }
  if (!signingKey) {
    throw new Error('Please specify signingKey');
  }

  const sig = new xmlcrypto.SignedXml();
  sig.signatureAlgorithm = 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256';
  sig.keyInfoProvider = new PubKeyInfo(publicKey);
  sig.signingKey = signingKey;
  sig.addReference(
    authnXPath,
    ['http://www.w3.org/2000/09/xmldsig#enveloped-signature', 'http://www.w3.org/2001/10/xml-exc-c14n#'],
    'http://www.w3.org/2001/04/xmlenc#sha256'
  );
  sig.computeSignature(xml, {
    location: { reference: authnXPath + issuerXPath, action: 'after' },
  });

  return sig.getSignedXml();
};

const request = ({
  ssoUrl,
  entityID,
  callbackUrl,
  isPassive = false,
  forceAuthn = false,
  identifierFormat = 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
  providerName = 'BoxyHQ',
  signingKey,
  publicKey,
}: SAMLReq): { id: string; request: string } => {
  const id = idPrefix + crypto.randomBytes(10).toString('hex');
  const date = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const samlReq: Record<string, any> = {
    'samlp:AuthnRequest': {
      '@xmlns:samlp': 'urn:oasis:names:tc:SAML:2.0:protocol',
      '@ID': id,
      '@Version': '2.0',
      '@IssueInstant': date,
      '@ProtocolBinding': 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
      '@Destination': ssoUrl,
      'saml:Issuer': {
        '@xmlns:saml': 'urn:oasis:names:tc:SAML:2.0:assertion',
        '#text': entityID,
      },
    },
  };

  if (isPassive) samlReq['samlp:AuthnRequest']['@IsPassive'] = true;

  if (forceAuthn) {
    samlReq['samlp:AuthnRequest']['@ForceAuthn'] = true;
  }

  samlReq['samlp:AuthnRequest']['@AssertionConsumerServiceURL'] = callbackUrl;

  samlReq['samlp:AuthnRequest']['samlp:NameIDPolicy'] = {
    '@xmlns:samlp': 'urn:oasis:names:tc:SAML:2.0:protocol',
    '@Format': identifierFormat,
    '@AllowCreate': 'true',
  };

  if (providerName != null) {
    samlReq['samlp:AuthnRequest']['@ProviderName'] = providerName;
  }

  let xml = xmlbuilder.create(samlReq).end({});
  if (signingKey) {
    xml = signRequest(xml, signingKey, publicKey);
  }

  return {
    id,
    request: xml,
  };
};

const parseAsync = async (rawAssertion: string): Promise<SAMLProfile> => {
  return new Promise((resolve, reject) => {
    saml.parse(rawAssertion, function onParseAsync(err: Error, profile: SAMLProfile) {
      if (err) {
        reject(err);
        return;
      }

      resolve(profile);
    });
  });
};

const validateAsync = async (rawAssertion: string, options): Promise<SAMLProfile> => {
  return new Promise((resolve, reject) => {
    saml.validate(rawAssertion, options, function onValidateAsync(err, profile: SAMLProfile) {
      if (err) {
        reject(err);
        return;
      }

      if (profile && profile.claims) {
        // we map claims to our attributes id, email, firstName, lastName where possible. We also map original claims to raw
        profile.claims = claims.map(profile.claims);

        // some providers don't return the id in the assertion, we set it to a sha256 hash of the email
        if (!profile.claims.id) {
          profile.claims.id = crypto.createHash('sha256').update(profile.claims.email).digest('hex');
        }
      }

      resolve(profile);
    });
  });
};

const parseMetadataAsync = async (idpMeta: string): Promise<Record<string, any>> => {
  return new Promise((resolve, reject) => {
    xml2js.parseString(idpMeta, { tagNameProcessors: [xml2js.processors.stripPrefix] }, (err: Error, res) => {
      if (err) {
        reject(err);
        return;
      }

      const entityID = rambda.path('EntityDescriptor.$.entityID', res);
      let X509Certificate = null;
      let ssoPostUrl: null | undefined = null;
      let ssoRedirectUrl: null | undefined = null;
      let loginType = 'idp';
      let sloRedirectUrl: null | undefined = null;
      let sloPostUrl: null | undefined = null;

      let ssoDes: any = rambda.pathOr(null, 'EntityDescriptor.IDPSSODescriptor', res);
      if (!ssoDes) {
        ssoDes = rambda.pathOr([], 'EntityDescriptor.SPSSODescriptor', res);
        if (!ssoDes) {
          loginType = 'sp';
        }
      }

      for (const ssoDesRec of ssoDes) {
        const keyDes = ssoDesRec['KeyDescriptor'];
        for (const keyDesRec of keyDes) {
          if (keyDesRec['$'] && keyDesRec['$'].use === 'signing') {
            const ki = keyDesRec['KeyInfo'][0];
            const cd = ki['X509Data'][0];
            X509Certificate = cd['X509Certificate'][0];
          }
        }

        const ssoSvc = ssoDesRec['SingleSignOnService'] || ssoDesRec['AssertionConsumerService'] || [];
        for (const ssoSvcRec of ssoSvc) {
          if (rambda.pathOr('', '$.Binding', ssoSvcRec).endsWith('HTTP-POST')) {
            ssoPostUrl = rambda.path('$.Location', ssoSvcRec);
          } else if (rambda.pathOr('', '$.Binding', ssoSvcRec).endsWith('HTTP-Redirect')) {
            ssoRedirectUrl = rambda.path('$.Location', ssoSvcRec);
          }
        }

        const sloSvc = ssoDesRec['SingleLogoutService'] || [];
        for (const sloSvcRec of sloSvc) {
          if (rambda.pathOr('', '$.Binding', sloSvcRec).endsWith('HTTP-Redirect')) {
            sloRedirectUrl = rambda.path('$.Location', sloSvcRec);
          } else if (rambda.pathOr('', '$.Binding', sloSvcRec).endsWith('HTTP-POST')) {
            sloPostUrl = rambda.path('$.Location', sloSvcRec);
          }
        }
      }

      const ret: Record<string, any> = {
        sso: {},
        slo: {},
      };

      if (entityID) {
        ret.entityID = entityID;
      }

      if (X509Certificate) {
        ret.thumbprint = thumbprint.calculate(X509Certificate);
      }

      if (ssoPostUrl) {
        ret.sso.postUrl = ssoPostUrl;
      }

      if (ssoRedirectUrl) {
        ret.sso.redirectUrl = ssoRedirectUrl;
      }

      if (sloRedirectUrl) {
        ret.slo.redirectUrl = sloRedirectUrl;
      }

      if (sloPostUrl) {
        ret.slo.postUrl = sloPostUrl;
      }

      ret.loginType = loginType;

      resolve(ret);
    });
  });
};

export default { request, parseAsync, validateAsync, parseMetadataAsync, PubKeyInfo };
