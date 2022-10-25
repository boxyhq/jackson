import {
  ISetupLinkController,
  SetupLinkApiResponse,
  SetupLinkCreatePayload,
  SetupLinkRegeneratePayload,
  Storable,
} from '../typings';
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
  async create(body: SetupLinkCreatePayload): Promise<SetupLinkApiResponse> {
    const { tenant, product, path, regenerate } = body;
    const setupID = dbutils.keyDigest(dbutils.keyFromParts(tenant, product, path));
    const token = crypto.randomBytes(24).toString('hex');
    const val = {
      setupID,
      tenant,
      product,
      path,
      validTill: +new Date(new Date().setHours(new Date().getHours() + 3)),
      url: `${process.env.NEXTAUTH_URL}/setup/${token}`,
    };
    const existing = await this.setupLinkStore.getByIndex({
      name: IndexNames.TenantProductService,
      value: dbutils.keyFromParts(tenant, product, path),
    });
    if (existing.length > 0 && !regenerate) {
      return { data: existing[0], error: undefined };
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
          value: dbutils.keyFromParts(tenant, product, path),
        }
      );
      return { data: val, error: undefined };
    }
  }
  async getByToken(token: string): Promise<SetupLinkApiResponse> {
    const val = await this.setupLinkStore.getByIndex({
      name: IndexNames.SetupToken,
      value: token,
    });
    if (val.length === 0) {
      return {
        data: undefined,
        error: {
          message: 'Link is not valid!',
          code: 401,
        },
      };
    }
    if (val.validTill < new Date()) {
      return {
        data: undefined,
        error: {
          message: 'Link is expired!',
          code: 401,
        },
      };
    }
    return { data: val[0], error: undefined };
  }
  regenerate(body: SetupLinkRegeneratePayload): Promise<SetupLinkApiResponse> {
    throw new Error('Method not implemented.' + body);
  }
  getAll(): Promise<SetupLinkApiResponse> {
    throw new Error('Method not implemented.');
  }
}
