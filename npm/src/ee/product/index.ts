import { JacksonError } from '../../controller/error';
import { throwIfInvalidLicense } from '../common/checkLicense';
import type { Storable, JacksonOption } from '../../typings';

type ProductConfig = {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
};

export class ProductController {
  private productStore: Storable;
  private opts: JacksonOption;

  constructor({ productStore, opts }: { productStore: Storable; opts: JacksonOption }) {
    this.productStore = productStore;
    this.opts = opts;
  }

  public async get(productId: string) {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    const product = (await this.productStore.get(productId)) as ProductConfig;

    if (!product) {
      throw new JacksonError('Product not found.', 404);
    }

    return product;
  }

  public async upsert(params: Partial<ProductConfig> & { id: string }) {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    if (!('id' in params)) {
      throw new JacksonError('Provide a product id', 400);
    }

    const product = await this.productStore.get(params.id);

    const toUpdate = product ? { ...product, ...params } : params;

    await this.productStore.put(params.id, toUpdate);
  }
}
