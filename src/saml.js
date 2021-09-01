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

        const ssoDes = rambda.path('EntityDescriptor.IDPSSODescriptor', res);
        for (let i = 0; i < ssoDes.length; ++i) {
          const keyDes = ssoDes[i]['KeyDescriptor'];
          for (let j = 0; j < keyDes.length; ++j) {
            if (keyDes[j]['$'] && keyDes[j]['$'].use === 'signing') {
              const ki = keyDes[j]['KeyInfo'][0];
              const cd = ki['X509Data'][0];
              X509Certificate = cd['X509Certificate'][0];
            }
          }
        }

        // TODO: SingleSignOnService
        resolve({
          entityID,
          X509Certificate,
        });
      });
    });
  },
};
