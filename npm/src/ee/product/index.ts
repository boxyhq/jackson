import { JacksonError } from '../../controller/error';
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

    const product = (await this.productStore.get(productId)) as Product;

    if (!product) {
      throw new JacksonError('Product not found.', 404);
    }

    return product;
  }

  public async upsert(params: Partial<Product> & { id: string }) {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    if (!('id' in params)) {
      throw new JacksonError('Provide a product id', 400);
    }

    const product = (await this.productStore.get(params.id)) as Product;

    if (!product) {
      await this.productStore.put(params.id, { ...params });
      return;
    }

    await this.productStore.put(product.id, { ...product, ...params });
  }
}
