var saml = require('@boxyhq/saml20');
var xml2js = require('xml2js');

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

        resolve(res);
      });
    });
  },
};
