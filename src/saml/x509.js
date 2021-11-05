const x509 = require('@peculiar/x509');
const { Crypto } = require('@peculiar/webcrypto');

const crypto = new Crypto();
x509.cryptoProvider.set(crypto);

const alg = {
  name: 'RSASSA-PKCS1-v1_5',
  hash: 'SHA-256',
  publicExponent: new Uint8Array([1, 0, 1]),
  modulusLength: 2048,
};

const generate = async () => {
  const keys = await crypto.subtle.generateKey(alg, true, ['sign', 'verify']);

  const extensions = [
    new x509.BasicConstraintsExtension(false, undefined, true),
  ];

  extensions.push(
    new x509.KeyUsagesExtension(x509.KeyUsageFlags.digitalSignature, true)
  );
  extensions.push(
    await x509.SubjectKeyIdentifierExtension.create(keys.publicKey)
  );

  const cert = await x509.X509CertificateGenerator.createSelfSigned({
    serialNumber: '01',
    name: 'CN=BoxyHQ Jackson',
    notBefore: new Date(),
    notAfter: new Date('3021/01/01'), // TODO: set shorter expiry and rotate ceritifcates
    signingAlgorithm: alg,
    keys: keys,
    extensions,
  });

  const pkcs8 = await crypto.subtle.exportKey('pkcs8', keys.privateKey);

  return {
    publicKey: cert.toString('pem'),
    privateKey: x509.PemConverter.encode(pkcs8, 'private key'),
  };
};

module.exports = {
  generate,
};
