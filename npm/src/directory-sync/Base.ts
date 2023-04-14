import type { Storable, DatabaseStore } from '../typings';
import { storeNamespacePrefix } from '../controller/utils';
import { randomUUID } from 'crypto';

export class Base {
  protected db: DatabaseStore;
  protected tenant: null | string = null;
  protected product: null | string = null;
  protected bulkDeleteBatchSize = 500;

  constructor({ db }: { db: DatabaseStore }) {
    this.db = db;
  }

  // Return the database store
  store(type: 'groups' | 'members' | 'users' | 'logs'): Storable {
    if (!this.tenant || !this.product) {
      throw new Error('Set tenant and product before using store.');
    }

    return this.db.store(`${storeNamespacePrefix.dsync[type]}:${this.tenant}:${this.product}`);
  }

  setTenant(tenant: string): this {
    this.tenant = tenant;

    return this;
  }

  setProduct(product: string): this {
    this.product = product;

    return this;
  }

  // Set the tenant and product
  setTenantAndProduct(tenant: string, product: string): this {
    return this.setTenant(tenant).setProduct(product);
  }

  // Set the tenant and product
  with(tenant: string, product: string): this {
    return this.setTenant(tenant).setProduct(product);
  }

  createId(): string {
    return randomUUID();
  }
}
