import { GetByProductParams, Records, Storable } from '../typings';
import { generateMnemonic } from '@boxyhq/error-code-mnemonic';
import { IndexNames } from '../controller/utils';
import { keyFromParts } from '../db/utils';
import type { SSOTrace, Trace } from './types';
import { JacksonError } from '../controller/error';

const INTERVAL_1_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const INTERVAL_1_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * @swagger
 * definitions:
 *   SSOTrace:
 *      type: object
 *      properties:
 *        traceId:
 *          type: string
 *          description: Trace ID
 *        error:
 *          type: string
 *          description: Error
 *        timestamp:
 *          type: string
 *          description: Timestamp
 *        context:
 *          type: object
 *          properties:
 *            tenant:
 *              type: string
 *              description: Tenant
 *            product:
 *              type: string
 *              description: Product
 *            clientID:
 *              type: string
 *              description: Connection client ID
 *            issuer:
 *              type: string
 *              description: Issuer
 *            relayState:
 *              type: string
 *              description: Relay state
 *            samlResponse:
 *              type: string
 *              description: SAML response
 *            isSAMLFederated:
 *              type: boolean
 *              description: Indicates if SAML is federated
 *            isIdPFlow:
 *              type: boolean
 *              description: Indicates if request is from IdP
 */
class SSOTracer {
  tracerStore: Storable;

  constructor({ tracerStore }) {
    this.tracerStore = tracerStore;
    // Clean up stale traces at the start
    this.cleanUpStaleTraces();
    // Set timer to run every day
    setInterval(async () => {
      this.cleanUpStaleTraces();
    }, INTERVAL_1_DAY_MS);
  }

  public async saveTrace(payload: SSOTrace) {
    try {
      const { context } = payload;
      // Friendly trace id
      const traceId: string = await generateMnemonic();
      // If timestamp present in payload use that value, else generate the current timestamp
      const timestamp = typeof payload.timestamp === 'number' ? payload.timestamp : Date.now();
      const traceValue: Trace = { ...payload, traceId, timestamp };
      const { tenant, product, clientID } = context;

      const indices = [
        {
          name: IndexNames.TenantProduct,
          value: keyFromParts(tenant, product),
          filterLogic: ({ tenant, product }) => !!(tenant && product),
        },
        {
          name: IndexNames.SSOClientID,
          value: clientID,
          filterLogic: ({ clientID }) => !!clientID,
        },
        {
          name: IndexNames.Product,
          value: product,
          filterLogic: ({ product }) => !!product,
        },
      ]
        .filter(({ filterLogic }) => filterLogic(context))
        .map(({ name, value }) => ({ name, value }));

      await this.tracerStore.put(traceId, traceValue, ...indices);
      return traceId;
    } catch (err: unknown) {
      console.error(`Failed to save trace`, err);
    }
  }

  /**
   * @swagger
   * /api/v1/sso-traces:
   *   get:
   *     summary: Get trace by ID
   *     parameters:
   *       - name: id
   *         description: Trace ID
   *         in: query
   *         required: true
   *         type: string
   *     tags:
   *       - SSO Traces
   *     produces:
   *       - application/json
   *     responses:
   *       '200':
   *         description: Success
   *         schema:
   *           $ref: '#/definitions/SSOTrace'
   */
  public async getByTraceId(traceId: string) {
    return (await this.tracerStore.get(traceId)) as Trace;
  }

  public async getAllTraces(
    pageOffset?: number,
    pageLimit?: number,
    pageToken?: string
  ): Promise<Records<Trace>> {
    return await this.tracerStore.getAll(pageOffset || 0, pageLimit || 0, pageToken);
  }

  /** Cleans up stale traces older than 1 week */
  public async cleanUpStaleTraces() {
    let staleTraces: Trace[] = [];
    for (let pageOffset = 0, pageTokenMap = {}; ; pageOffset += 50) {
      const { data: page, pageToken: nextPageToken } = await this.getAllTraces(
        pageOffset,
        50,
        pageTokenMap[pageOffset]
      );
      pageTokenMap[pageOffset + 50] = nextPageToken;
      if (page.length === 0) {
        break;
      }
      staleTraces = staleTraces.concat(
        page.filter(({ timestamp }) => Date.now() - timestamp > INTERVAL_1_WEEK_MS)
      );
    }

    for (let i = 0; i < staleTraces.length; i++) {
      await this.tracerStore.delete(staleTraces[i].traceId);
    }
  }

  /**
   * @swagger
   * /api/v1/sso-traces/product:
   *   get:
   *     summary: Get all traces for a product
   *     parameters:
   *      - $ref: '#/parameters/product'
   *      - $ref: '#/parameters/pageOffset'
   *      - $ref: '#/parameters/pageLimit'
   *      - $ref: '#/parameters/pageToken'
   *     tags:
   *       - SSO Traces
   *     produces:
   *       - application/json
   *     responses:
   *       '200':
   *         description: Success
   *         content:
   *           application/json:
   *              schema:
   *                type: object
   *                properties:
   *                  data:
   *                    type: array
   *                    items:
   *                      $ref: '#/definitions/SSOTrace'
   *                  pageToken:
   *                    type: string
   *                    description: token for pagination
   */
  public async getTracesByProduct(params: GetByProductParams) {
    const { product, pageOffset, pageLimit, pageToken } = params;

    if (!product) {
      throw new JacksonError('Please provide a `product`.', 400);
    }

    const traces = await this.tracerStore.getByIndex(
      {
        name: IndexNames.Product,
        value: product,
      },
      pageOffset,
      pageLimit,
      pageToken
    );

    return traces;
  }
}

export default SSOTracer;
