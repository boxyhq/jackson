import { test, expect } from '@playwright/test';
import {
  createConnection,
  deleteConnection,
  newConnection,
  deleteSSOTraces,
  getSSOTracesByProduct,
  getSSOTraceById,
  countSSOTracesByProduct,
} from '../../helpers/sso';
import { options } from '../../helpers/api';
import { oauthAuthorize } from '../../helpers/oauth';

test.use(options);

test.afterEach(async ({ request }) => {
  const { tenant, product } = newConnection;

  // Delete the connection & traces after each test
  await deleteConnection(request, { tenant, product });
  await deleteSSOTraces(request, { product });
});

test.describe('POST /api/v1/sso', () => {
  test('should be able to get empty list of traces', async ({ request }) => {
    await createConnection(request, newConnection);

    const list = await getSSOTracesByProduct(request, { product: newConnection.product });

    expect(list.data.length).toBe(0);
  });

  test('should be able to get non empty list of traces', async ({ request }) => {
    await createConnection(request, newConnection);
    await oauthAuthorize(
      request,
      {
        client_id: 'dummy',
        tenant: 'dummy',
        product: newConnection.product,
        state: 'Bb-w_AqDxZh90BBVz4PRhtRIRetOgo0AR0pmrhzyICU',
        response_type: 'code',
        redirect_uri: newConnection.redirectUrl[0].replaceAll('*', ''),
        code_challenge: 'OcMni5eZvSrQ2ev7tPICbcE7q1piL8Abi8IfJtWbUtY',
        code_challenge_method: 'S256',
      },
      true
    );

    const res = await countSSOTracesByProduct(request, { product: newConnection.product });

    expect(res.count).toBeGreaterThan(0);
  });

  test('should be able to get sso trace by Id', async ({ request }) => {
    await createConnection(request, newConnection);
    await oauthAuthorize(
      request,
      {
        client_id: 'dummy',
        tenant: 'dummy',
        product: newConnection.product,
        state: 'Bb-w_AqDxZh90BBVz4PRhtRIRetOgo0AR0pmrhzyICU',
        response_type: 'code',
        redirect_uri: newConnection.redirectUrl[0].replaceAll('*', ''),
        code_challenge: 'OcMni5eZvSrQ2ev7tPICbcE7q1piL8Abi8IfJtWbUtY',
        code_challenge_method: 'S256',
      },
      true
    );

    const list = await getSSOTracesByProduct(request, { product: newConnection.product });
    expect(list.data.length).toBe(1);

    const trace = await getSSOTraceById(request, { id: list.data[0].traceId });
    expect(trace.data).toMatchObject(list.data[0]);
  });

  test('should be able to delete sso trace by product', async ({ request }) => {
    await createConnection(request, newConnection);
    await oauthAuthorize(
      request,
      {
        client_id: 'dummy',
        tenant: 'dummy',
        product: newConnection.product,
        state: 'Bb-w_AqDxZh90BBVz4PRhtRIRetOgo0AR0pmrhzyICU',
        response_type: 'code',
        redirect_uri: newConnection.redirectUrl[0].replaceAll('*', ''),
        code_challenge: 'OcMni5eZvSrQ2ev7tPICbcE7q1piL8Abi8IfJtWbUtY',
        code_challenge_method: 'S256',
      },
      true
    );

    let res = await countSSOTracesByProduct(request, { product: newConnection.product });
    expect(res.count).toBeGreaterThan(0);

    await deleteSSOTraces(request, { product: newConnection.product });

    res = await countSSOTracesByProduct(request, { product: newConnection.product });
    expect(res.count).toBe(0);
  });
});
