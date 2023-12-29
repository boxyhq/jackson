import { JacksonError } from '../../controller/error';
import { throwIfInvalidLicense } from '../common/checkLicense';
import type { Storable, JacksonOption, ProductConfig } from '../../typings';

const defaultProductConfig: Omit<ProductConfig, 'id'> = {
  name: null,
  teamId: null,
  teamName: null,
  logoUrl: null,
  primaryColor: null,
  faviconUrl: null,
  companyName: null,
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

    const productConfig = (await this.productStore.get(productId)) as ProductConfig;

    if (!productConfig) {
      console.error(`Product config not found for ${productId}`);
    }

    return {
      ...defaultProductConfig,
      ...productConfig,
    };
  }

  public async upsert(params: Partial<ProductConfig> & { id: string }) {
    await throwIfInvalidLicense(this.opts.boxyhqLicenseKey);

    if (!('id' in params)) {
      throw new JacksonError('Provide a product id', 400);
    }

    const productConfig = (await this.productStore.get(params.id)) as ProductConfig;

    const toUpdate = productConfig ? { ...productConfig, ...params } : params;

    await this.productStore.put(params.id, toUpdate);
  }
}
