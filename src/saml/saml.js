const saml = require('@boxyhq/saml20');
const xml2js = require('xml2js');
const rambda = require('rambda');
const thumbprint = require('thumbprint');
const xmlbuilder = require('xmlbuilder');
const crypto = require('crypto');
const xmlcrypto = require('xml-crypto');

const idPrefix = '_';
const authnXPath =
  '/*[local-name(.)="AuthnRequest" and namespace-uri(.)="urn:oasis:names:tc:SAML:2.0:protocol"]';
const issuerXPath =
  '/*[local-name(.)="Issuer" and namespace-uri(.)="urn:oasis:names:tc:SAML:2.0:assertion"]';

const signRequest = (xml, signingKey) => {
  if (!xml) {
    throw new Error('Please specify xml');
  }
  if (!signingKey) {
    throw new Error('Please specify signingKey');
  }

  const sig = new xmlcrypto.SignedXml();
  sig.signatureAlgorithm = 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256';
  sig.signingKey = signingKey;
  sig.addReference(
    authnXPath,
    [
      'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
      'http://www.w3.org/2001/10/xml-exc-c14n#',
    ],
    'http://www.w3.org/2001/04/xmlenc#sha256'
  );
  sig.computeSignature(xml, {
    location: { reference: authnXPath + issuerXPath, action: 'after' },
  });

  return sig.getSignedXml();
};

module.exports = {
  request: ({
    ssoUrl,
    entityID,
    callbackUrl,
    isPassive = false,
    forceAuthn = false,
    identifierFormat = 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
    providerName = 'BoxyHQ',
    signingKey,
  }) => {
    const id = idPrefix + crypto.randomBytes(10).toString('hex');
    const date = new Date().toISOString();

    const samlReq = {
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
      xml = signRequest(xml, signingKey);
    }

    return {
      id,
      request: xml,
    };
  },

  parseAsync: async (rawAssertion) => {
    return new Promise((resolve, reject) => {
      saml.parse(rawAssertion, function onParseAsync(err, profile) {
        if (err) {
          reject(err);
          return;
        }

        resolve(profile);
      });
    });
  },

  validateAsync: async (rawAssertion, options) => {
    return new Promise((resolve, reject) => {
      saml.validate(
        rawAssertion,
        options,
        function onValidateAsync(err, profile) {
          if (err) {
            reject(err);
            return;
          }

          resolve(profile);
        }
      );
    });
  },

  parseMetadataAsync: async (idpMeta) => {
    return new Promise((resolve, reject) => {
      xml2js.parseString(
        idpMeta,
        { tagNameProcessors: [xml2js.processors.stripPrefix] },
        (err, res) => {
          if (err) {
            reject(err);
            return;
          }

          const entityID = rambda.path('EntityDescriptor.$.entityID', res);
          let X509Certificate = null;
          let ssoPostUrl = null;
          let ssoRedirectUrl = null;
          let loginType = 'idp';

          let ssoDes = rambda.pathOr(
            null,
            'EntityDescriptor.IDPSSODescriptor',
            res
          );
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

            const ssoSvc =
              ssoDesRec['SingleSignOnService'] ||
              ssoDesRec['AssertionConsumerService'] ||
              [];
            for (const ssoSvcRec of ssoSvc) {
              if (
                rambda.pathOr('', '$.Binding', ssoSvcRec).endsWith('HTTP-POST')
              ) {
                ssoPostUrl = rambda.path('$.Location', ssoSvcRec);
              } else if (
                rambda
                  .pathOr('', '$.Binding', ssoSvcRec)
                  .endsWith('HTTP-Redirect')
              ) {
                ssoRedirectUrl = rambda.path('$.Location', ssoSvcRec);
              }
            }
          }

          const ret = {
            sso: {},
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
          ret.loginType = loginType;

          resolve(ret);
        }
      );
    });
  },
};
