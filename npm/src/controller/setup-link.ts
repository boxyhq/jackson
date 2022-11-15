import { ApiResponse, ISetupLinkController, SetupLink, SetupLinkCreatePayload, Storable } from '../typings';
import * as dbutils from '../db/utils';
import { IndexNames } from './utils';
import crypto from 'crypto';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const g = global as never;

export class SetupLinkController implements ISetupLinkController {
  setupLinkStore: Storable;

  constructor({ setupLinkStore }) {
    this.setupLinkStore = setupLinkStore;
  }
  async create(body: SetupLinkCreatePayload): Promise<ApiResponse<SetupLink>> {
    const { tenant, product, service, regenerate } = body;
    const setupID = dbutils.keyDigest(dbutils.keyFromParts(tenant, product, service));
    const token = crypto.randomBytes(24).toString('hex');
    const val = {
      setupID,
      tenant,
      product,
      service,
      validTill: +new Date(new Date().setHours(new Date().getHours() + 3)),
      url: `${process.env.NEXTAUTH_URL}/setup/${token}`,
    };
    const existing = await this.setupLinkStore.getByIndex({
      name: IndexNames.TenantProductService,
      value: dbutils.keyFromParts(tenant, product, service),
    });
    if (existing.length > 0 && !regenerate && existing[0].validTill > +new Date()) {
      return { data: existing[0], error: null };
    } else {
      await this.setupLinkStore.put(
        setupID,
        val,
        {
          name: IndexNames.SetupToken,
          value: token,
        },
        {
          name: IndexNames.TenantProductService,
          value: dbutils.keyFromParts(tenant, product, service),
        }
      );
      return { data: val, error: null };
    }
  }
  async getByToken(token: string): Promise<ApiResponse<SetupLink>> {
    const val = await this.setupLinkStore.getByIndex({
      name: IndexNames.SetupToken,
      value: token,
    });
    if (val.length === 0) {
      return {
        data: null,
        error: {
          message: 'Link not found!',
          code: 404,
        },
      };
    }
    if (val.validTill < new Date()) {
      return {
        data: null,
        error: {
          message: 'Link is expired!',
          code: 401,
        },
      };
    }
    return { data: val[0], error: null };
  }
  getAll(): Promise<ApiResponse<SetupLink[]>> {
    throw new Error('Method not implemented.');
  }
}
