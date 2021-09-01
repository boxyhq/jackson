var saml = require('@boxyhq/saml20');
var xml2js = require('xml2js');
var rambda = require('rambda');

module.exports = {
  parse: async function (rawAssertion) {
    return new Promise(function (resolve, reject) {
      saml.parse(rawAssertion, function onParseAsync(err, profile) {
        if (err) {
          reject(err);
          return;
        }

        resolve(profile);
      });
    });
  },

  validate: async function (rawAssertion, options) {
    return new Promise(function (resolve, reject) {
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

  parseMetadata: async function (idpMeta) {
    return new Promise(function (resolve, reject) {
      xml2js.parseString(idpMeta, { tagNameProcessors: [ xml2js.processors.stripPrefix ] }, function (err, res) {
        if (err) {
          reject(err);
          return;
        }

        const entityID = rambda.path('EntityDescriptor.$.entityID', res);
        let X509Certificate = null;
        let ssoPostUrl = null;
        let ssoRedirectUrl = null;

        const ssoDes = rambda.pathOr([], 'EntityDescriptor.IDPSSODescriptor', res);
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
            if (rambda.pathOr('', '$.Binding', ssoSvc[i]).endsWith('HTTP-POST')) {
              ssoPostUrl = rambda.path('$.Location', ssoSvc[i]);
            } else if (rambda.pathOr('', '$.Binding', ssoSvc[i]).endsWith('HTTP-Redirect')) {
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
          ret.X509Certificate = X509Certificate;
        }
        if (ssoPostUrl) {
          ret.sso.postUrl = ssoPostUrl;
        }
        if (ssoRedirectUrl) {
          ret.sso.redirectUrl = ssoRedirectUrl;
        }

        resolve(ret);
      });
    });
  },
};
