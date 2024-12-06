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
    create_sso_connection: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 45 },
        { duration: '40s', target: 55 },
        { duration: '20s', target: 0 },
      ],
    },
    update_sso_connection: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 45 },
        { duration: '40s', target: 45 },
        { duration: '20s', target: 0 },
      ],
    },
    get_sso_connection: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 65 },
        { duration: '40s', target: 65 },
        { duration: '20s', target: 0 },
      ],
    },
    get_sso_connection_by_product: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 25 },
        { duration: '40s', target: 25 },
        { duration: '20s', target: 0 },
      ],
    },
    delete_sso_connection: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 25 },
        { duration: '40s', target: 25 },
        { duration: '20s', target: 0 },
      ],
    },
    create_setup_link: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 25 },
        { duration: '40s', target: 25 },
        { duration: '20s', target: 0 },
      ],
    },
    get_setup_link: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 25 },
        { duration: '40s', target: 25 },
        { duration: '20s', target: 0 },
      ],
    },
    delete_setup_link: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 25 },
        { duration: '40s', target: 25 },
        { duration: '20s', target: 0 },
      ],
    },
    create_dsync_setup_link: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 25 },
        { duration: '40s', target: 25 },
        { duration: '20s', target: 0 },
      ],
    },
    get_dsync_setup_link: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 25 },
        { duration: '40s', target: 25 },
        { duration: '20s', target: 0 },
      ],
    },
    get_dsync_setup_link_by_product: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 25 },
        { duration: '40s', target: 25 },
        { duration: '20s', target: 0 },
      ],
    },
    delete_dsync_setup_link: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 25 },
        { duration: '40s', target: 25 },
        { duration: '20s', target: 0 },
      ],
    },
    create_directory: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 25 },
        { duration: '40s', target: 25 },
        { duration: '20s', target: 0 },
      ],
    },
    get_directory_by_tenant_and_product: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 25 },
        { duration: '40s', target: 25 },
        { duration: '20s', target: 0 },
      ],
    },
    get_directory_by_id: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 25 },
        { duration: '40s', target: 25 },
        { duration: '20s', target: 0 },
      ],
    },
    get_directory_by_product: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 25 },
        { duration: '40s', target: 25 },
        { duration: '20s', target: 0 },
      ],
    },
    update_directory: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 25 },
        { duration: '40s', target: 25 },
        { duration: '20s', target: 0 },
      ],
    },
    delete_directory: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 25 },
        { duration: '40s', target: 25 },
        { duration: '20s', target: 0 },
      ],
    },
    create_saml_federation_app: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 25 },
        { duration: '40s', target: 25 },
        { duration: '20s', target: 0 },
      ],
    },
    update_saml_federation_app: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 25 },
        { duration: '40s', target: 25 },
        { duration: '20s', target: 0 },
      ],
    },
    get_saml_federation_app: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 25 },
        { duration: '40s', target: 25 },
        { duration: '20s', target: 0 },
      ],
    },
    get_saml_federation_app_by_product: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 25 },
        { duration: '40s', target: 25 },
        { duration: '20s', target: 0 },
      ],
    },
    delete_saml_federation_app: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 25 },
        { duration: '40s', target: 25 },
        { duration: '20s', target: 0 },
      ],
    },
  },
};

const BASE_URL = 'http://localhost:5225/api/v1';

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

function generateSSOPayload() {
  const { tenant, product } = vuContext[__VU];
  const defaultRedirectUrl = `http://localhost:3366/login/saml`;
  const redirectUrl = [`http://localhost:3366/*`];
  const name = `SSOConnection-${randomString(5)}-${tenant}-${product}`;
  const description = `SSOConnection Description - ${randomString(10)}`;
  const namespace = randomString(8);
  const metadataUrl = `https://mocksaml.com/api/namespace/${namespace}/saml/metadata`;

  return {
    tenant,
    product,
    defaultRedirectUrl,
    redirectUrl,
    name,
    description,
    metadataUrl,
  };
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

function generateSetUpLinkPayload() {
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
  createSetUpLink();
  getSetUpLink();
  deleteSetUpLink();
  createDSyncSetUpLink();
  getDSyncSetUpLink();
  getDSyncSetUpLinkByProduct();
  deleteDSyncSetUpLink();
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
  sleep(1);
}

//Single Sign On

function createSSOConnection() {
  const payload = generateSSOPayload();

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

function updateSSOConnection() {
  const { tenant, product, clientID, clientSecret, metadataUrl } = vuContext[__VU];

  if (!tenant || !product || !clientID || !clientSecret || !metadataUrl) {
    console.error('Missing context data for SSO Connection update.');
    return;
  }

  const payload = generateUpdateSSOPayload();

  const response = http.patch(`${BASE_URL}/sso`, JSON.stringify(payload), {
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

  const response = http.get(`${BASE_URL}/sso?tenant=${tenant}&product=${product}`, {
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

  const response = http.get(`${BASE_URL}/sso?product=${product}&clientID=${clientID}`, {
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

  const response = http.del(`${BASE_URL}/sso?product=${product}&tenant=${tenant}`, null, {
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

function createSetUpLink() {
  const payload = generateSetUpLinkPayload();

  const response = http.post(`${BASE_URL}/sso/setuplinks`, JSON.stringify(payload), {
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

function getSetUpLink() {
  const { tenant, product } = vuContext[__VU];
  console.log(`GET Request Params - Tenant: ${tenant}, Product: ${product}`);

  const response = http.get(`${BASE_URL}/sso/setuplinks?tenant=${tenant}&product=${product}`, {
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

function deleteSetUpLink() {
  const { tenant, product } = vuContext[__VU];
  console.log(`DELETE Request Params - Tenant: ${tenant}, Product: ${product}`);

  const response = http.del(`${BASE_URL}/sso/setuplinks??product=${product}&tenant=${tenant}`, null, {
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

function createDSyncSetUpLink() {
  const payload = generateDSyncSetUpLinkPayload();

  const response = http.post(`${BASE_URL}/dsync/setuplinks`, JSON.stringify(payload), {
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

function getDSyncSetUpLink() {
  const { tenant, product } = vuContext[__VU];
  console.log(`GET Request Params - Tenant: ${tenant}, Product: ${product}`);

  const response = http.get(`${BASE_URL}/dsync/setuplinks?tenant=${tenant}&product=${product}`, {
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

function getDSyncSetUpLinkByProduct() {
  const { product } = vuContext[__VU];
  console.log(`GET Request Params - Product: ${product}`);

  const response = http.get(`${BASE_URL}/dsync/setuplinks/product?product=${product}`, {
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

function deleteDSyncSetUpLink() {
  const { tenant, product } = vuContext[__VU];
  console.log(`DELETE Request Params - Tenant: ${tenant}, Product: ${product}`);

  const response = http.del(`${BASE_URL}/dsync/setuplinks?tenant=${tenant}&product=${product}`, null, {
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

  const response = http.post(`${BASE_URL}/dsync`, JSON.stringify(payload), {
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

  const response = http.get(`${BASE_URL}/dsync?tenant=${tenant}&product=${product}`, {
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

  const response = http.get(`${BASE_URL}/dsync/${directoryId}`, {
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

  const response = http.get(`${BASE_URL}/dsync/product?product=${product}`, {
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

  const response = http.patch(`${BASE_URL}/dsync/${directoryId}`, payload, {
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

  const response = http.del(`${BASE_URL}/dsync/${directoryId}`, null, {
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

  const response = http.post(`${BASE_URL}/identity-federation`, JSON.stringify(payload), {
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
