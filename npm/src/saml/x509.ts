import * as forge from 'node-forge';
import crypto from 'crypto';

import type { Storable } from '../typings';

const pki = forge.pki;
let certificateStore: Storable;
let cachedCertificate: { publicKey: string; privateKey: string };

export const init = async (store: Storable) => {
  certificateStore = store;

  return await getDefaultCertificate();
};

export const generateCertificate = () => {
  const today = new Date();
  const keys = pki.rsa.generateKeyPair(2048);
  const cert = pki.createCertificate();

  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date(today.setFullYear(today.getFullYear() + 30));

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

export const getDefaultCertificate = async (): Promise<{ publicKey: string; privateKey: string }> => {
  if (cachedCertificate) {
    return cachedCertificate;
  }

  if (!certificateStore) {
    throw new Error('Certificate store not initialized');
  }

  const certificate = await certificateStore.get('default');

  // If certificate is expired let it drop through so it creates a new cert
  if (certificate && !(await isCertificateExpired(certificate.publicKey))) {
    return certificate;
  }

  // If default certificate is not found or has expired, create one and store it.
  cachedCertificate = generateCertificate();

  await certificateStore.put('default', cachedCertificate);

  return cachedCertificate;
};

const isCertificateExpired = async (publicKey: string) => {
  const { validTo } = new crypto.X509Certificate(publicKey);

  return !(validTo != 'Bad time value' && new Date(validTo) > new Date());
};
