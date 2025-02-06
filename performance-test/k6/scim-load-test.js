import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution';
import { Counter } from 'k6/metrics';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// Custom metrics
export const errorCount = new Counter('errors');

// Load test options
export const options = {
  discardResponseBodies: false,
  thresholds: {
    // http_req_duration: ['p(95)<500'], // 95% of requests should complete in under 500ms
    errors: ['count<1'], // Fewer than 1 error allowed
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

const _cache = {};

function generateUserPayload() {
  const userName = `user-${randomString(8)}`;
  const email = `${userName}@example.com`;

  return {
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
    userName: userName,
    name: {
      givenName: 'Test',
      familyName: 'User',
    },
    emails: [
      {
        primary: true,
        value: email,
        type: 'work',
      },
    ],
    active: true,
  };
}

function generateGroupPayload() {
  const groupName = `group-${randomString(8)}`;

  return {
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
    displayName: groupName,
    members: [],
  };
}

export async function setup() {
  // For example: Create initial directory

  const directoryPayload = {
    tenant: 'performance-test-boxyhq',
    product: 'scim-saml-jackson',
    name: 'load-test-scim',
    type: 'okta-scim-v2',
    webhook_url: '',
    webhook_secret: '',
  };

  const response = await http.asyncRequest('POST', `${API_V1}/dsync`, JSON.stringify(directoryPayload), {
    headers: manageHeaders,
  });

  const isSuccessful = check(response, {
    'Directory creation Response status is 201': (r) => r.status === 201,
  });

  if (isSuccessful) {
    const { data } = response.json();

    console.log(`SCIM Directory created successfully for tenant: ${data.tenant}, product: ${data.product}`);
    return { directoryId: data.id, scim: data.scim };
  } else {
    errorCount.add(1);
    console.error(
      `SCIM directory creation failed Status: ${response.status}, Response: ${JSON.stringify(response)}`
    );
    exec.test.abort('create directory connection status code was *not* 200');
  }
}

export async function teardown({ directoryId }) {
  // Delete directory
  await http.asyncRequest('DELETE', `${API_V1}/dsync/${directoryId}`, null, {
    headers: { Authorization: manageHeaders['Authorization'] },
  });
}

export default async function loadTest({ scim }) {
  // Users
  await createUser({ scim });
  //   await getUser();
  //   await listUsers();
  //   await updateUser();
  //   await replaceUser();
  //   await deleteUser();

  //   // Groups
  //   await createGroup();
  //   await getGroup();
  //   await listGroups();
  //   await updateGroup();
  //   await addUserToGroup();
  //   await removeUserFromGroup();
  //   await deleteGroup();

  sleep(1);
}

// User Operations
async function createUser({ scim }) {
  const payload = generateUserPayload();

  const response = await http.asyncRequest('POST', `${scim.endpoint}/Users`, JSON.stringify(payload), {
    headers: {
      Authorization: `Bearer ${scim.secret}`,
    },
  });

  const isSuccessful = check(response, {
    'createUser Response status is 201': (r) => r.status === 201,
  });

  if (isSuccessful) {
    const responseData = JSON.parse(response.body);
    _cache.userId = responseData.id;
    console.log(`User created successfully with ID: ${responseData.id}`);
  } else {
    errorCount.add(1);
    console.error(`User creation failed. Status: ${response.status}, Response: ${JSON.stringify(response)}`);
  }
}

// Add other user operation functions here: getUser(), listUsers(), updateUser(), replaceUser(), deleteUser()

// Group Operations
// async function createGroup() {
//   const payload = generateGroupPayload();

//   const response = await http.asyncRequest('POST', `${SCIM_V2}/Groups`, JSON.stringify(payload), {
//     headers: manageHeaders,
//     tags: {
//       scim: 'create_group',
//     },
//   });

//   const isSuccessful = check(response, {
//     'createGroup Response status is 201': (r) => r.status === 201,
//   });

//   if (isSuccessful) {
//     const responseData = JSON.parse(response.body);
//     _cache.groupId = responseData.id;
//     console.log(`Group created successfully with ID: ${responseData.id}`);
//   } else {
//     errorCount.add(1);
//     console.error(`Group creation failed. Status: ${response.status}, Response: ${JSON.stringify(response)}`);
//   }
// }

// Add other group operation functions here: getGroup(), listGroups(), updateGroup(),
// addUserToGroup(), removeUserFromGroup(), deleteGroup()
