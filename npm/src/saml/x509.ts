import * as forge from 'node-forge';
const pki = forge.pki;
const generate = () => {
  const today = new Date();
  const keys = pki.rsa.generateKeyPair(2048);
  const cert = pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date(today.setFullYear(today.getFullYear() + 10));
  const attrs = [
    {
      name: 'commonName',
      value: 'BoxyHQ Jackson',
    },
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.setExtensions([
    {
      name: 'basicConstraints',
      cA: false,
    },
    {
      name: 'keyUsage',
      keyCertSign: false,
      digitalSignature: true,
      nonRepudiation: false,
      keyEncipherment: false,
      dataEncipherment: false,
    },
  ]);
  // self-sign certificate
  cert.sign(keys.privateKey, forge.md.sha256.create());

  return {
    publicKey: pki.certificateToPem(cert),
    privateKey: pki.privateKeyToPem(keys.privateKey),
  };
};

export default {
  generate,
};
