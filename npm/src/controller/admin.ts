import { IAdminController, Storable } from '../typings';

export class AdminController implements IAdminController {
  connectionStore: Storable;

  constructor({ connectionStore }) {
    this.connectionStore = connectionStore;
  }

  public async getAllConnection(pageOffset?: number, pageLimit?: number): Promise<Partial<any>[]> {
    const connectionList = (await this.connectionStore.getAll(pageOffset, pageLimit)) as Partial<any>[];
    if (!connectionList || !connectionList.length) {
      return [];
    }
    return connectionList;
  }
}
