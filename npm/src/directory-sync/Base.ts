import type { Storable, DatabaseStore } from '../typings';
import { storeNamespacePrefix } from '../controller/utils';

export class Base {
  protected db: DatabaseStore;
  protected tenant = '';
  protected product = '';

  constructor({ db }: { db: DatabaseStore }) {
    this.db = db;
  }

  // Return the database store
  store(type: 'groups' | 'members' | 'users'): Storable {
    if (!this.tenant || !this.product) {
      throw new Error('Set tenant and product before using store.');
    }

    return this.db.store(`${storeNamespacePrefix.dsync[type]}:${this.tenant}:${this.product}`);
  }

  // Set the tenant and product
  setTenantAndProduct(tenant: string, product: string): this {
    this.tenant = tenant;
    this.product = product;

    return this;
  }

  // Set the tenant and product
  with(tenant: string, product: string): this {
    return this.setTenantAndProduct(tenant, product);
  }
}
