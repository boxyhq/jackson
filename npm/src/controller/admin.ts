import { IAdminController, Storable, OAuth } from '../typings';

export class AdminController implements IAdminController {
  configStore: Storable;

  constructor({ configStore }) {
    this.configStore = configStore;
  }

  public async getAllConfig(): Promise<Partial<OAuth>[]> {
    const configList = (await this.configStore.getAll()) as Partial<OAuth>[];
    if (!configList || !configList.length) {
      return [];
    }
    return configList;
  }
}
