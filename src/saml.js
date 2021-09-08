const saml = require('@boxyhq/saml20');
const xml2js = require('xml2js');
const rambda = require('rambda');
const thumbprint = require('thumbprint');
const xmlbuilder = require('xmlbuilder');
const crypto = require('crypto');

module.exports = {
  request: ({
    ssoUrl,
    entityID,
    callbackUrl,
    isPassive = false,
    forceAuthn = false,
    identifierFormat = 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
    providerName = 'BoxyHQ',
  }) => {
    const id = '_' + crypto.randomBytes(10).toString('hex');
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

    // TODO: Sign the request
    return xmlbuilder.create(samlReq).end({});
  },

  parse: async (rawAssertion) => {
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

  validate: async (rawAssertion, options) => {
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

  parseMetadata: async (idpMeta) => {
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

          const ssoDes = rambda.pathOr(
            [],
            'EntityDescriptor.IDPSSODescriptor',
            res
          );
          for (let i = 0; i < ssoDes.length; ++i) {
            const keyDes = ssoDes[i]['KeyDescriptor'];
            for (let j = 0; j < keyDes.length; ++j) {
              if (keyDes[j]['$'] && keyDes[j]['$'].use === 'signing') {
                const ki = keyDes[j]['KeyInfo'][0];
                const cd = ki['X509Data'][0];
                X509Certificate = cd['X509Certificate'][0];
              }
            }

            const ssoSvc = ssoDes[i]['SingleSignOnService'] || [];
            for (let i = 0; i < ssoSvc.length; ++i) {
              if (
                rambda.pathOr('', '$.Binding', ssoSvc[i]).endsWith('HTTP-POST')
              ) {
                ssoPostUrl = rambda.path('$.Location', ssoSvc[i]);
              } else if (
                rambda
                  .pathOr('', '$.Binding', ssoSvc[i])
                  .endsWith('HTTP-Redirect')
              ) {
                ssoRedirectUrl = rambda.path('$.Location', ssoSvc[i]);
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

          resolve(ret);
        }
      );
    });
  },
};
