import { throwIfInvalidLicense } from '../common/checkLicense';
import type { Storable, Product, JacksonOption } from '../../typings';

export class ProductController {
  private productStore: Storable;
  private opts: JacksonOption;

  constructor({ productStore, opts }: { productStore: Storable; opts: JacksonOption }) {
    this.productStore = productStore;
    this.opts = opts;
  }

  public async get(productId: string) {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    return (await this.productStore.get(productId)) as Product;
  }

  public async upsert(product: Product) {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    await this.productStore.put(product.id, { ...product });
  }
}
