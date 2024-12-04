import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';
import { randomString } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// Custom metrics
export const errorCount = new Counter('errors');

// Load test options
export const options = {
    discardResponseBodies: false,
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% of requests should complete in under 500ms
        errors: ['count<10'], // Fewer than 10 errors allowed
    },
    scenarios: {
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
    },
};

const BASE_URL = 'http://localhost:5225/api/v1';

const manageHeaders = {
    'Authorization': 'Api-Key secret',
    'Content-Type': 'application/json',
};

// Per-VU context to store tenant, product, and directoryId
const vuContext = {};

// Generate dynamic payload
function generateDirectoryPayload() {
    const tenant = `tenant-${randomString(8)}`;
    const product = `product-${randomString(8)}`;
    vuContext[__VU] = { tenant, product }; // Store per-VU context
    return {
        webhook_url: `http://example.com/webhook-${randomString(8)}`,
        webhook_secret: randomString(12),
        tenant,
        product,
        name: `Directory-${randomString(5)}`,
        type: 'okta-scim-v2',
    };
}

export default function () {
    createDirectory();
    getDirectoryByTenantAndProduct();
    getDirectoryById();
    getDirectoryByProduct();
    updateDirectory();
    deleteDirectory()
    sleep(1);
}

function createDirectory() {
    const payload = generateDirectoryPayload();

    const response = http.post(`${BASE_URL}/dsync`, JSON.stringify(payload), {
        headers: manageHeaders,
    });

    // Check HTTP status and Content-Type
    const isSuccessful = check(response, {
        'CreateDirectory Response status is 201': (r) => r.status === 201,
        'Content-Type is JSON': (r) =>
            r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
    });

    // Parse the JSON response
    const result = response.json();

    // Check if result and data are defined before accessing id
    if (result && result.data && result.data.id) {
        vuContext[__VU].directoryId = result.data.id; // Store the ID
    } else {
        console.error("Directory ID not found in response:", JSON.stringify(result));
    }

    if (!isSuccessful) {
        errorCount.add(1);
        console.error(`Directory creation failed. Status: ${response.status}, Response: ${JSON.stringify(response)}`);
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
        'Content-Type is JSON': (r) =>
            r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
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
        'Content-Type is JSON': (r) =>
            r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
    });

    if (!isSuccessful) {
        errorCount.add(1);
        console.error(`GET request failed for Directory ID: ${directoryId}. Status: ${response.status}, Response: ${JSON.stringify(response)}`);
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
        'Content-Type is JSON': (r) =>
            r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
    });

    if (!isSuccessful) {
        errorCount.add(1);
        console.error(`GET request failed for Product: ${product}. Status: ${response.status}, Response: ${JSON.stringify(response)}`);
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

    // Generate a unique, random name for the directory
    const updatedDirectoryName = `Directory-${randomString(10)}`;

    const payload = JSON.stringify({
        name: updatedDirectoryName,
    });

    const response = http.patch(`${BASE_URL}/dsync/${directoryId}`, payload, {
        headers: manageHeaders,
    });

    const isSuccessful = check(response, {
        'updateDirectoryName Response status is 200': (r) => r.status === 200,
        'Content-Type is JSON': (r) =>
            r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
    });

    if (isSuccessful) {
        console.log(`Directory name successfully updated to: ${updatedDirectoryName}`);
    } else {
        errorCount.add(1);
        console.error(`PATCH request failed for Directory ID: ${directoryId}. Status: ${response.status}, Response: ${JSON.stringify(response)}`);
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
        'Content-Type is JSON': (r) =>
            r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
    });

    if (isSuccessful) {
        console.log(`Directory successfully deleted. ID: ${directoryId}`);
    } else {
        errorCount.add(1);
        console.error(`DELETE request failed for Directory ID: ${directoryId}. Status: ${response.status}, Response: ${JSON.stringify(response)}`);
    }
}

