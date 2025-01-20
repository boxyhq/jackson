import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

/* eslint-disable no-undef */

// Custom metrics
export const errorCount = new Counter('errors');

// Load test options
export const options = {
  discardResponseBodies: false,
  thresholds: {
    // http_req_duration: ['p(95)<500'], // 95% of requests should complete in under 500ms
    errors: ['count<10'], // Fewer than 10 errors allowed
  },
  scenarios: {
    load_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 45 },
        { duration: '40s', target: 55 },
        { duration: '20s', target: 0 },
      ],
    },
  },
};

const BASE_URL = 'http://localhost:5225';
const API_V1 = `${BASE_URL}/api/v1`;

const manageHeaders = {
  Authorization: 'Api-Key secret',
  'Content-Type': 'application/json',
};

// Per-VU context to store tenant, product, directoryId, clinetID, clientSecret
const vuContext = {};

function generateUniqueTenantAndProduct() {
  const tenant = `tenant-${randomString(8)}`;
  const product = `product-${randomString(8)}`;
  vuContext[__VU] = { tenant, product };
}

function generateSSOPayload(rawMetadata) {
  const { tenant, product } = vuContext[__VU];
  const defaultRedirectUrl = `http://localhost:3366/login/saml`;
  const redirectUrl = [`http://localhost:3366/*`];
  const name = `SSOConnection-${randomString(5)}-${tenant}-${product}`;
  const description = `SSOConnection Description - ${randomString(10)}`;
  const namespace = randomString(8);
  const metadataUrl = `https://mocksaml.com/api/namespace/${namespace}/saml/metadata`;

  const _payload = {
    tenant,
    product,
    defaultRedirectUrl,
    redirectUrl,
    name,
    description,
  };

  if (rawMetadata) {
    _payload.rawMetadata = rawMetadata;
  } else {
    _payload.metadataUrl = metadataUrl;
  }
  return _payload;
}

function generateUpdateSSOPayload() {
  const { tenant, product, clientID, clientSecret, metadataUrl } = vuContext[__VU];

  const defaultRedirectUrl = `http://localhost:3366/login/saml`;
  const redirectUrl = [`http://localhost:3366/*`];
  const name = `SSOConnection-${randomString(8)}-${tenant}-${product}`;
  const description = `SSOConnection Description - ${randomString(11)}`;

  return {
    tenant,
    product,
    clientID,
    clientSecret,
    defaultRedirectUrl,
    redirectUrl,
    name,
    description,
    metadataUrl,
  };
}

function generateSetupLinkPayload() {
  const { tenant, product } = vuContext[__VU];
  const redirectUrl = ['http://localhost:3000'];
  const defaultRedirectUrl = 'http://localhost:3000/default';

  return {
    tenant,
    product,
    redirectUrl,
    defaultRedirectUrl,
  };
}

function generateDSyncSetUpLinkPayload() {
  const { tenant, product } = vuContext[__VU];
  const name = `DSyncSetUpLink-${randomString(8)}-${tenant}-${product}`;
  const expiryDays = Math.floor(Math.random() * 2) + 1;
  const webhook_url = `http://localhost:5225/api/${randomString(5)}`;
  const webhook_secret = randomString(5);

  return {
    tenant,
    product,
    name,
    expiryDays,
    webhook_url,
    webhook_secret,
  };
}

function generateDirectoryPayload() {
  const { tenant, product } = vuContext[__VU];
  return {
    webhook_url: `http://example.com/webhook-${randomString(8)}`,
    webhook_secret: randomString(12),
    tenant,
    product,
    name: `Directory-${randomString(5)}`,
    type: 'okta-scim-v2',
  };
}

function generateSAMLFederationAppPayload() {
  const { tenant, product } = vuContext[__VU];
  return {
    acsUrl: `https://iam.twilio.com/v1/Accounts/ACxxxxxxxxxxxxxx${randomString(8)}`,
    entityId: `https://boxyhq.com/entity-id/${randomString(5)}`,
    redirectUrl: `http://localhost:3366`,
    type: 'oidc',
    tenant,
    product,
    name: `id-fed-app-${randomString(5)}`,
  };
}

export default function loadTest() {
  generateUniqueTenantAndProduct();
  createSSOConnection();
  getSSOConnection();
  updateSSOConnection();
  getSSOConnectionByProduct();
  deleteSSOConnection();
  createSetupLink();
  getSetupLink();
  deleteSetupLink();
  createDSyncSetupLink();
  getDSyncSetupLink();
  getDSyncSetupLinkByProduct();
  deleteDSyncSetupLink();
  createDirectory();
  getDirectoryByTenantAndProduct();
  getDirectoryById();
  getDirectoryByProduct();
  updateDirectory();
  deleteDirectory();
  createSAMLFederationApp();
  updateSAMLFederationApp();
  getSAMLFederationApp();
  getSAMLFederationAppByProduct();
  deleteSAMLFederationApp();
  // benchmark SAML response path
  createSSOConnectionViaRawMetadata();
  processSAMLResponse();
  sleep(1);
}

//Single Sign On

function createSSOConnection() {
  const payload = generateSSOPayload();

  const response = http.post(`${API_V1}/sso`, JSON.stringify(payload), {
    headers: manageHeaders,
  });

  const isSuccessful = check(response, {
    'createSSOConnection Response status is 200': (r) => r.status === 200,
  });

  if (isSuccessful) {
    const responseData = JSON.parse(response.body);

    vuContext[__VU] = {
      tenant: responseData.tenant,
      product: responseData.product,
      clientID: responseData.clientID,
      clientSecret: responseData.clientSecret,
      metadataUrl: responseData.metadataUrl,
    };

    console.log(
      `SSO Connection created successfully for tenant: ${responseData.tenant}, product: ${responseData.product}`
    );
  } else {
    errorCount.add(1);
    console.error(
      `SSO Connection creation failed. Status: ${response.status}, Response: ${JSON.stringify(response)}`
    );
  }
}

function updateSSOConnection() {
  const { tenant, product, clientID, clientSecret, metadataUrl } = vuContext[__VU];

  if (!tenant || !product || !clientID || !clientSecret || !metadataUrl) {
    console.error('Missing context data for SSO Connection update.');
    return;
  }

  const payload = generateUpdateSSOPayload();

  const response = http.patch(`${API_V1}/sso`, JSON.stringify(payload), {
    headers: manageHeaders,
  });

  const isSuccessful = check(response, {
    'updateSSOConnection Response status is 204': (r) => r.status === 204,
  });

  if (isSuccessful) {
    console.log(`SSO Connection successfully updated for tenant: ${tenant}, product: ${product}`);
  } else {
    errorCount.add(1);
    console.error(
      `SSO Connection update failed. Status: ${response.status}, Response: ${JSON.stringify(response)}`
    );
  }
}

function getSSOConnection() {
  const { tenant, product } = vuContext[__VU];
  console.log(`GET Request Params - Tenant: ${tenant}, Product: ${product}`);

  const response = http.get(`${API_V1}/sso?tenant=${tenant}&product=${product}`, {
    headers: manageHeaders,
  });

  const isSuccessful = check(response, {
    'getSSOConnection Response status is 200': (r) => r.status === 200,
  });

  if (!isSuccessful) {
    errorCount.add(1);
    console.error(`GET request failed. Status: ${response.status}, Response: ${JSON.stringify(response)}`);
  }
}

function getSSOConnectionByProduct() {
  const { product, clientID } = vuContext[__VU];
  console.log(`GET Request Params - Product: ${product}, ClinetID: ${clientID}`);

  const response = http.get(`${API_V1}/sso?product=${product}&clientID=${clientID}`, {
    headers: manageHeaders,
  });

  const isSuccessful = check(response, {
    'getSSOConnectionByProduct Response status is 200': (r) => r.status === 200,
  });

  if (!isSuccessful) {
    errorCount.add(1);
    console.error(`GET request failed. Status: ${response.status}, Response: ${JSON.stringify(response)}`);
  }
}

function deleteSSOConnection() {
  const { tenant, product } = vuContext[__VU];
  console.log(`DELETE Request Params - Tenant: ${tenant}, Product: ${product}`);

  const response = http.del(`${API_V1}/sso?product=${product}&tenant=${tenant}`, null, {
    headers: manageHeaders,
  });

  const isSuccessful = check(response, {
    'deleteSSOConnection Response status is 204': (r) => r.status === 204,
  });

  if (!isSuccessful) {
    errorCount.add(1);
    console.error(`DELETE request failed. Status: ${response.status}, Response: ${JSON.stringify(response)}`);
  }
}

//SetUp Links | Single Sign On

function createSetupLink() {
  const payload = generateSetupLinkPayload();

  const response = http.post(`${API_V1}/sso/setuplinks`, JSON.stringify(payload), {
    headers: manageHeaders,
  });

  const isSuccessful = check(response, {
    'createSetUpLink Response status is 201': (r) => r.status === 201,
  });

  if (!isSuccessful) {
    errorCount.add(1);
    console.error(
      `SetUpLink creation failed. Status: ${response.status}, Response: ${JSON.stringify(response)}`
    );
  }
}

function getSetupLink() {
  const { tenant, product } = vuContext[__VU];
  console.log(`GET Request Params - Tenant: ${tenant}, Product: ${product}`);

  const response = http.get(`${API_V1}/sso/setuplinks?tenant=${tenant}&product=${product}`, {
    headers: manageHeaders,
  });

  const isSuccessful = check(response, {
    'getSetUpLink Response status is 200': (r) => r.status === 200,
  });

  if (!isSuccessful) {
    errorCount.add(1);
    console.error(`GET request failed. Status: ${response.status}, Response: ${JSON.stringify(response)}`);
  }
}

function deleteSetupLink() {
  const { tenant, product } = vuContext[__VU];
  console.log(`DELETE Request Params - Tenant: ${tenant}, Product: ${product}`);

  const response = http.del(`${API_V1}/sso/setuplinks?product=${product}&tenant=${tenant}`, null, {
    headers: manageHeaders,
  });

  const isSuccessful = check(response, {
    'deleteSetUpLink Response status is 200': (r) => r.status === 200,
  });

  if (!isSuccessful) {
    errorCount.add(1);
    console.error(`DELETE request failed. Status: ${response.status}, Response: ${JSON.stringify(response)}`);
  }
}

//SetUp Links | Directory Sync

function createDSyncSetupLink() {
  const payload = generateDSyncSetUpLinkPayload();

  const response = http.post(`${API_V1}/dsync/setuplinks`, JSON.stringify(payload), {
    headers: manageHeaders,
  });

  const isSuccessful = check(response, {
    'createDSyncSetUpLink Response status is 201': (r) => r.status === 201,
  });

  if (!isSuccessful) {
    errorCount.add(1);
    console.error(
      `DSyncSetUpLink creation failed. Status: ${response.status}, Response: ${JSON.stringify(response)}`
    );
  }
}

function getDSyncSetupLink() {
  const { tenant, product } = vuContext[__VU];
  console.log(`GET Request Params - Tenant: ${tenant}, Product: ${product}`);

  const response = http.get(`${API_V1}/dsync/setuplinks?tenant=${tenant}&product=${product}`, {
    headers: manageHeaders,
  });

  const isSuccessful = check(response, {
    'getDSyncSetUpLink Response status is 200': (r) => r.status === 200,
  });

  if (!isSuccessful) {
    errorCount.add(1);
    console.error(`GET request failed. Status: ${response.status}, Response: ${JSON.stringify(response)}`);
  }
}

function getDSyncSetupLinkByProduct() {
  const { product } = vuContext[__VU];
  console.log(`GET Request Params - Product: ${product}`);

  const response = http.get(`${API_V1}/dsync/setuplinks/product?product=${product}`, {
    headers: manageHeaders,
  });

  const isSuccessful = check(response, {
    'getDSyncLinkByProduct Response status is 200': (r) => r.status === 200,
  });

  if (!isSuccessful) {
    errorCount.add(1);
    console.error(`GET request failed. Status: ${response.status}, Response: ${JSON.stringify(response)}`);
  }
}

function deleteDSyncSetupLink() {
  const { tenant, product } = vuContext[__VU];
  console.log(`DELETE Request Params - Tenant: ${tenant}, Product: ${product}`);

  const response = http.del(`${API_V1}/dsync/setuplinks?tenant=${tenant}&product=${product}`, null, {
    headers: manageHeaders,
  });

  const isSuccessful = check(response, {
    'deleteDSyncSetUpLink Response status is 200': (r) => r.status === 200,
  });

  if (!isSuccessful) {
    errorCount.add(1);
    console.error(`DELETE request failed. Status: ${response.status}, Response: ${JSON.stringify(response)}`);
  }
}

//Directory Sync

function createDirectory() {
  const payload = generateDirectoryPayload();

  const response = http.post(`${API_V1}/dsync`, JSON.stringify(payload), {
    headers: manageHeaders,
  });

  const isSuccessful = check(response, {
    'CreateDirectory Response status is 201': (r) => r.status === 201,
  });

  const result = response.json();

  // Check if result and data are defined before accessing id
  if (result && result.data && result.data.id) {
    vuContext[__VU].directoryId = result.data.id;
  } else {
    console.error('Directory ID not found in response:', JSON.stringify(result));
  }

  if (!isSuccessful) {
    errorCount.add(1);
    console.error(
      `Directory creation failed. Status: ${response.status}, Response: ${JSON.stringify(response)}`
    );
  }
}

function getDirectoryByTenantAndProduct() {
  const { tenant, product } = vuContext[__VU]; // Retrieve per-VU context
  console.log(`GET Request Params - Tenant: ${tenant}, Product: ${product}`);

  const response = http.get(`${API_V1}/dsync?tenant=${tenant}&product=${product}`, {
    headers: manageHeaders,
  });

  const isSuccessful = check(response, {
    'getDirectoryByTenantAndProduct Response status is 200': (r) => r.status === 200,
  });

  if (!isSuccessful) {
    errorCount.add(1);
    console.error(`GET request failed. Status: ${response.status}, Response: ${JSON.stringify(response)}`);
  }
}

function getDirectoryById() {
  const { directoryId } = vuContext[__VU]; // Retrieve directory ID from context

  if (!directoryId) {
    console.error('Directory ID not found for this VU.');
    return;
  }

  const response = http.get(`${API_V1}/dsync/${directoryId}`, {
    headers: manageHeaders,
  });

  const isSuccessful = check(response, {
    'getDirectoryById Response status is 200': (r) => r.status === 200,
  });

  if (!isSuccessful) {
    errorCount.add(1);
    console.error(
      `GET request failed for Directory ID: ${directoryId}. Status: ${response.status}, Response: ${JSON.stringify(response)}`
    );
  } else {
    console.log(`Directory successfully retrieved by ID: ${directoryId}`);
  }
}

function getDirectoryByProduct() {
  const { product } = vuContext[__VU]; // Retrieve product from context

  const response = http.get(`${API_V1}/dsync/product?product=${product}`, {
    headers: manageHeaders,
  });

  const isSuccessful = check(response, {
    'getDirectoryByProduct Response status is 200': (r) => r.status === 200,
  });

  if (!isSuccessful) {
    errorCount.add(1);
    console.error(
      `GET request failed for Product: ${product}. Status: ${response.status}, Response: ${JSON.stringify(response)}`
    );
  } else {
    console.log(`Directory successfully retrieved by Product: ${product}`);
  }
}

function updateDirectory() {
  const { directoryId } = vuContext[__VU];

  if (!directoryId) {
    console.error('Directory ID not found for this VU.');
    return;
  }

  const updatedDirectoryName = `Directory-${randomString(10)}`;

  const payload = JSON.stringify({
    name: updatedDirectoryName,
  });

  const response = http.patch(`${API_V1}/dsync/${directoryId}`, payload, {
    headers: manageHeaders,
  });

  const isSuccessful = check(response, {
    'updateDirectoryName Response status is 200': (r) => r.status === 200,
  });

  if (isSuccessful) {
    console.log(`Directory name successfully updated to: ${updatedDirectoryName}`);
  } else {
    errorCount.add(1);
    console.error(
      `PATCH request failed for Directory ID: ${directoryId}. Status: ${response.status}, Response: ${JSON.stringify(response)}`
    );
  }
}

function deleteDirectory() {
  const { directoryId } = vuContext[__VU];

  if (!directoryId) {
    console.error('Directory ID not found for this VU.');
    return;
  }

  const response = http.del(`${API_V1}/dsync/${directoryId}`, null, {
    headers: manageHeaders,
  });

  const isSuccessful = check(response, {
    'deleteDirectory Response status is 200': (r) => r.status === 200,
  });

  if (isSuccessful) {
    console.log(`Directory successfully deleted. ID: ${directoryId}`);
  } else {
    errorCount.add(1);
    console.error(
      `DELETE request failed for Directory ID: ${directoryId}. Status: ${response.status}, Response: ${JSON.stringify(response)}`
    );
  }
}

//SAML Federation App

function createSAMLFederationApp() {
  const payload = generateSAMLFederationAppPayload();

  const response = http.post(`${API_V1}/identity-federation`, JSON.stringify(payload), {
    headers: manageHeaders,
  });

  const isSuccessful = check(response, {
    'createSAMLFederationApp Response status is 201': (r) => r.status === 201,
  });

  const result = response.json();

  if (result && result.data && result.data.id) {
    vuContext[__VU].samlFederationAppId = result.data.id;
  } else {
    console.error('SAMLFederationApp ID not found in response:', JSON.stringify(result));
  }

  if (!isSuccessful) {
    errorCount.add(1);
    console.error(
      `SAMLFederationApp creation failed. Status: ${response.status}, Response: ${JSON.stringify(response)}`
    );
  }
}

function updateSAMLFederationApp() {
  const { samlFederationAppId } = vuContext[__VU];

  if (!samlFederationAppId) {
    console.error('SAMLFederationApp ID not found for this VU.');
  }

  const updatedSAMLFederationAppName = `id-fed-app-${randomString(4)}`;

  const payload = JSON.stringify({
    name: updatedSAMLFederationAppName,
    id: samlFederationAppId,
  });

  const response = http.patch(`${BASE_URL}/identity-federation`, payload, {
    headers: manageHeaders,
  });

  const isSuccessful = check(response, {
    'updateSAMLFederationApp Response status is 200': (r) => r.status === 200,
  });

  if (isSuccessful) {
    console.log(`SAMLFederationApp name successfully updated to: ${updatedSAMLFederationAppName}`);
  } else {
    errorCount.add(1);
    console.error(
      `PATCH request failed for SAMLFederationApp ID: ${samlFederationAppId}. Status: ${response.status}, Response: ${JSON.stringify(response)}`
    );
  }
}

function getSAMLFederationApp() {
  const { samlFederationAppId } = vuContext[__VU];

  if (!samlFederationAppId) {
    console.error('SAMLFederationApp ID not found for this VU.');
  }

  const response = http.get(`${BASE_URL}/identity-federation/?id=${samlFederationAppId}`, {
    headers: manageHeaders,
  });

  const isSuccessful = check(response, {
    'getSAMLFederationApp Response status is 200': (r) => r.status === 200,
  });

  if (!isSuccessful) {
    errorCount.add(1);
    console.error(
      `GET request failed for SAMLFederationApp ID: ${samlFederationAppId}. Status: ${response.status}, Response: ${JSON.stringify(response)}`
    );
  } else {
    console.log(`SAMLFederationApp successfully retrieved by ID: ${samlFederationAppId}`);
  }
}

function getSAMLFederationAppByProduct() {
  const { product } = vuContext[__VU];

  const response = http.get(`${BASE_URL}/identity-federation/product?product=${product}`, {
    headers: manageHeaders,
  });

  const isSuccessful = check(response, {
    'getSAMLFederationAppByProduct Response status is 200': (r) => r.status === 200,
  });

  if (!isSuccessful) {
    errorCount.add(1);
    console.error(
      `GET request failed for Product: ${product}. Status: ${response.status}, Response: ${JSON.stringify(response)}`
    );
  } else {
    console.log(`SAMLFederationAppByProduct successfully retrieved by Product: ${product}`);
  }
}

function deleteSAMLFederationApp() {
  const { samlFederationAppId } = vuContext[__VU];

  if (!samlFederationAppId) {
    console.error('SAMLFederationApp ID not found for this VU.');
  }

  const response = http.del(`${BASE_URL}/identity-federation/?id=${samlFederationAppId}`, null, {
    headers: manageHeaders,
  });

  const isSuccessful = check(response, {
    'deleteSAMLFederationApp Response status is 200': (r) => r.status === 200,
  });

  if (isSuccessful) {
    console.log(`SAMLFederationApp successfully deleted. ID: ${samlFederationAppId}`);
  } else {
    errorCount.add(1);
    console.error(
      `DELETE request failed for deleteSAMLFederationApp ID: ${samlFederationAppId}. Status: ${response.status}, Response: ${JSON.stringify(response)}`
    );
  }
}

function createSSOConnectionViaRawMetadata() {
  const rawMetadata = `<?xml version="1.0" encoding="UTF-8"?><md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="https://saml.example.com/entityid" validUntil="2033-01-05T12:15:32.426Z"><md:IDPSSODescriptor WantAuthnRequestsSigned="false" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol"><md:KeyDescriptor use="signing"><ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#"><ds:X509Data><ds:X509Certificate>${saml.stripCertHeaderAndFooter(Buffer.from(process.env.PUBLIC_KEY, 'base64').toString('utf-8'))}</ds:X509Certificate></ds:X509Data></ds:KeyInfo></md:KeyDescriptor><md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat><md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="https://mocksaml.com/api/saml/sso" /><md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://mocksaml.com/api/saml/sso" /></md:IDPSSODescriptor></md:EntityDescriptor>`;
  const payload = generateSSOPayload(rawMetadata);

  const response = http.post(`${BASE_URL}/sso`, JSON.stringify(payload), {
    headers: manageHeaders,
  });

  const isSuccessful = check(response, {
    'createSSOConnection Response status is 200': (r) => r.status === 200,
  });

  if (isSuccessful) {
    const responseData = JSON.parse(response.body);

    vuContext[__VU] = {
      tenant: responseData.tenant,
      product: responseData.product,
      clientID: responseData.clientID,
      clientSecret: responseData.clientSecret,
      metadataUrl: responseData.metadataUrl,
    };

    console.log(
      `SSO Connection created successfully for tenant: ${responseData.tenant}, product: ${responseData.product}`
    );
  } else {
    errorCount.add(1);
    console.error(
      `SSO Connection creation failed. Status: ${response.status}, Response: ${JSON.stringify(response)}`
    );
  }
}
function processSAMLResponse() {
  // const email = 'jackson@example.com';
  // const userId = createHash('sha256').update(email).digest('hex');
  // const userName = email.split('@')[0];
  // const user = {
  //   id: userId,
  //   email,
  //   firstName: userName,
  //   lastName: userName,
  // };
  const samlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:xs="http://www.w3.org/2001/XMLSchema" Destination="http://localhost:5225/api/oauth/saml" ID="_357fda977155591acefc" IssueInstant="2025-01-17T10:03:03.751Z" Version="2.0">
 <saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" Format="urn:oasis:names:tc:SAML:2.0:nameid-format:entity">https://saml.example.com/entityid-localhost</saml:Issuer>
 <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
  <SignedInfo>
   <CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"></CanonicalizationMethod>
   <SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"></SignatureMethod>
   <Reference URI="#_357fda977155591acefc">
    <Transforms>
     <Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></Transform>
     <Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"></Transform>
    </Transforms>
    <DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"></DigestMethod>
    <DigestValue>jMaRwF6QRm0XD3/9H7sry1/aaWOX7tniAavWXFRvx1U=</DigestValue>
   </Reference>
  </SignedInfo>
  <SignatureValue>d/1DUvwvqMN+5Iu/yV1a78AiAuvpjcyMlnUQa4TfkiiKY/3hoaEX5X/txZOjS8QHs39Nzx2/NB0wnDfZF1esIlb/nSueURI6QE/fXFnns4TQ2zWXRFjRlnYY+bcMOt9scl/H/SA5rnMOWW3jmrQVCFKEBUSfdY07q9UsfzWF/0Rz3XwT0mh4fyLV/4HkDC7rQzUPvQItDPM8T5SCszN8EU+Jc7BuPF3D1ZCm4SJCv9sYbKmuL0EkPqWadQWbWP6gPZXH/Cf110gwP7rDddr1zdDNKijrN/bzpZSe1WZ/KTd75GMTnjM/3o3u9NgQiQGLnY72HXNm/eHC3C3N0LBSHA==</SignatureValue>
  <KeyInfo>
   <X509Data>
    <X509Certificate>MIIDXTCCAkWgAwIBAgIURk/J0oQyqlZeAeYl5Rx1L/f8chwwDQYJKoZIhvcNAQEL
BQAwPTELMAkGA1UEBhMCSU4xDzANBgNVBAgMBktlcmFsYTEOMAwGA1UEBwwFS29j
aGkxDTALBgNVBAoMBEJveHkwIBcNMjQxMTE4MTYxNDE3WhgPMzAyNDAzMjExNjE0
MTdaMD0xCzAJBgNVBAYTAklOMQ8wDQYDVQQIDAZLZXJhbGExDjAMBgNVBAcMBUtv
Y2hpMQ0wCwYDVQQKDARCb3h5MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKC
AQEAqI5BkqWZMRfaGsMADicTXG6KFX826nVHnavv4D5VtVsVvmArGRkIZwWjiLd3
Isrd4v2NYDaF1gf10VOrltGJVMfXvq3GdEg+/gBa+qWE8nOBfAaHrCdeQFJZh7rT
8LRtlcVOGLgapxanQA4qIWIlydeUXEuvNl0KECHGH8qXT/pi0+q8OW6GalQKAAEn
fRIGAfRZUWLQzmgqQdFTDcsm9IHoFBtOavSNUoNGUxqcKA4WqlzeiuTdsemttWbu
F+xZU8YEcnaO8CbrUzJo7mEVofTJYi3Ovoj6p6wHy0dNrtnbXX6Xku9fPNtyG+vV
zAueYGtqJ8FfefqZpgHO/TYjEwIDAQABo1MwUTAdBgNVHQ4EFgQUYJ0ofqzwfnQ3
+0S1LOjBV/mw70IwHwYDVR0jBBgwFoAUYJ0ofqzwfnQ3+0S1LOjBV/mw70IwDwYD
VR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAnr60pDYRkkJeFn/+mgiq
KAIjOvDQ3dsw5If/4sAlIdkffCvuHbTqbIN55W8Z3d22UKrt3zVGx6pg2GfSUzpJ
A/dNyO28wD45J+3sbO0rjst5hIwYmYbTim8imLvnjmIwCCQCMKrZpI7nOVxWYMia
OedfIu8ywXxVGLJA+xLzZ3IJpl05wyvwqp7AjrFSAyJ0BryCPPeScHHrx/3ZGqYE
t0MbJrRJqJFQfwRBIWsMayfv4jxx7ghDaFik6mu1QpZkq+Aelq0mnxDA6RllwjAX
adqI1w5wYHEXD7xqqAnusr5NOCrbuAzwhLuau0zwkr3chfdpUlgyo7KLExLNxove
ig==</X509Certificate>
   </X509Data>
  </KeyInfo>
 </Signature>
 <samlp:Status xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol">
  <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"></samlp:StatusCode>
 </samlp:Status>
 <saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" xmlns:xs="http://www.w3.org/2001/XMLSchema" ID="_13e842b91f4f73f2d901" IssueInstant="2025-01-17T10:03:03.751Z" Version="2.0">
  <saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" Format="urn:oasis:names:tc:SAML:2.0:nameid-format:entity">https://saml.example.com/entityid-localhost</saml:Issuer>
  <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
   <SignedInfo>
    <CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"></CanonicalizationMethod>
    <SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"></SignatureMethod>
    <Reference URI="#_13e842b91f4f73f2d901">
     <Transforms>
      <Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></Transform>
      <Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"></Transform>
     </Transforms>
     <DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"></DigestMethod>
     <DigestValue>kqmrhLwfSQ7nPXlWwUyJx9PEIbDcoM4BTaofd2zy+iE=</DigestValue>
    </Reference>
   </SignedInfo>
   <SignatureValue>nA25tdHZGX6GnvvPDR3GQ1QcH/TaPAOLL+kfkyh1av6oZ3etQwZC12qWHTmoGbgHjTfEaCphFVLvsp8KGDh2ySSIt2cI4jgB73aJ1C1Ph1A4D+1/6vzV3CbdkQzAoH3XVwO0Zp+YWtBpIljKEUcFRaFYZaavSzVsmaoywmyq/9FNWhk4bZlBjT+xiJb5VEf/PywaLOAaAUT9WYdiMseycP9uPdYSQ7C3fHjAzfThveGcHBUUeYvA/Q2K4tCd7U0p6g0p5z5bXU9S0OLvU6kv2cN8jJpd5cwQFaBUvODw/qfvDDAsz0mjpyz2YbV8I8CaB6C3pt0zGIFT33lqRCuc/w==</SignatureValue>
   <KeyInfo>
    <X509Data>
     <X509Certificate>MIIDXTCCAkWgAwIBAgIURk/J0oQyqlZeAeYl5Rx1L/f8chwwDQYJKoZIhvcNAQEL
BQAwPTELMAkGA1UEBhMCSU4xDzANBgNVBAgMBktlcmFsYTEOMAwGA1UEBwwFS29j
aGkxDTALBgNVBAoMBEJveHkwIBcNMjQxMTE4MTYxNDE3WhgPMzAyNDAzMjExNjE0
MTdaMD0xCzAJBgNVBAYTAklOMQ8wDQYDVQQIDAZLZXJhbGExDjAMBgNVBAcMBUtv
Y2hpMQ0wCwYDVQQKDARCb3h5MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKC
AQEAqI5BkqWZMRfaGsMADicTXG6KFX826nVHnavv4D5VtVsVvmArGRkIZwWjiLd3
Isrd4v2NYDaF1gf10VOrltGJVMfXvq3GdEg+/gBa+qWE8nOBfAaHrCdeQFJZh7rT
8LRtlcVOGLgapxanQA4qIWIlydeUXEuvNl0KECHGH8qXT/pi0+q8OW6GalQKAAEn
fRIGAfRZUWLQzmgqQdFTDcsm9IHoFBtOavSNUoNGUxqcKA4WqlzeiuTdsemttWbu
F+xZU8YEcnaO8CbrUzJo7mEVofTJYi3Ovoj6p6wHy0dNrtnbXX6Xku9fPNtyG+vV
zAueYGtqJ8FfefqZpgHO/TYjEwIDAQABo1MwUTAdBgNVHQ4EFgQUYJ0ofqzwfnQ3
+0S1LOjBV/mw70IwHwYDVR0jBBgwFoAUYJ0ofqzwfnQ3+0S1LOjBV/mw70IwDwYD
VR0TAQH/BAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAnr60pDYRkkJeFn/+mgiq
KAIjOvDQ3dsw5If/4sAlIdkffCvuHbTqbIN55W8Z3d22UKrt3zVGx6pg2GfSUzpJ
A/dNyO28wD45J+3sbO0rjst5hIwYmYbTim8imLvnjmIwCCQCMKrZpI7nOVxWYMia
OedfIu8ywXxVGLJA+xLzZ3IJpl05wyvwqp7AjrFSAyJ0BryCPPeScHHrx/3ZGqYE
t0MbJrRJqJFQfwRBIWsMayfv4jxx7ghDaFik6mu1QpZkq+Aelq0mnxDA6RllwjAX
adqI1w5wYHEXD7xqqAnusr5NOCrbuAzwhLuau0zwkr3chfdpUlgyo7KLExLNxove
ig==</X509Certificate>
    </X509Data>
   </KeyInfo>
  </Signature>
  <saml:Subject xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">
   <saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">chris@example.com</saml:NameID>
   <saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
    <saml:SubjectConfirmationData NotOnOrAfter="2025-01-17T10:08:03.751Z" Recipient="http://localhost:5225/api/oauth/saml"></saml:SubjectConfirmationData>
   </saml:SubjectConfirmation>
  </saml:Subject>
  <saml:Conditions xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" NotBefore="2025-01-17T09:58:03.751Z" NotOnOrAfter="2025-01-17T10:08:03.751Z">
   <saml:AudienceRestriction>
    <saml:Audience>https://saml.boxyhq.com</saml:Audience>
   </saml:AudienceRestriction>
  </saml:Conditions>
  <saml:AuthnStatement xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" AuthnInstant="2025-01-17T10:03:03.751Z">
   <saml:AuthnContext>
    <saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml:AuthnContextClassRef>
   </saml:AuthnContext>
  </saml:AuthnStatement>
  <saml:AttributeStatement xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">
   <saml:Attribute Name="id" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:unspecified">
    <saml:AttributeValue xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">b4b5b0add35b4959f546b421b30cee70dad83efbce876d4a4d927f9a085efc78</saml:AttributeValue>
   </saml:Attribute>
   <saml:Attribute Name="email" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:unspecified">
    <saml:AttributeValue xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">chris@example.com</saml:AttributeValue>
   </saml:Attribute>
   <saml:Attribute Name="firstName" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:unspecified">
    <saml:AttributeValue xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">chris</saml:AttributeValue>
   </saml:Attribute>
   <saml:Attribute Name="lastName" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:unspecified">
    <saml:AttributeValue xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">chris</saml:AttributeValue>
   </saml:Attribute>
  </saml:AttributeStatement>
 </saml:Assertion>
</samlp:Response>
`;
  // const randomSAMLResponse = saml.createSAMLResponse({
  //   issuer: 'https://saml.example.com/entityid',
  //   audience: 'https://saml.boxyhq.com',
  //   acsUrl: 'http://localhost:5225/api/oauth/saml',
  //   requestId: '_' + crypto.randomBytes(10).toString('hex'),
  //   claims: {
  //     email,
  //     raw: user,
  //   },
  //   privateKey: process.env.PRIVATE_KEY,
  //   publicKey: process.env.PUBLIC_KEY,
  // });

  const response = http.post(
    `http://localhost:5225/api/oauth/saml`,
    { SAMLResponse: samlResponse },
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }
  );

  const isSuccessful = check(response, {
    'createSAMLFederationApp Response status is 201': (r) => r.status === 201,
  });

  const result = response.json();

  if (result && result.data && result.data.id) {
    vuContext[__VU].samlFederationAppId = result.data.id;
  } else {
    console.error('SAMLFederationApp ID not found in response:', JSON.stringify(result));
  }

  if (!isSuccessful) {
    errorCount.add(1);
    console.error(
      `SAMLFederationApp creation failed. Status: ${response.status}, Response: ${JSON.stringify(response)}`
    );
  }
}
