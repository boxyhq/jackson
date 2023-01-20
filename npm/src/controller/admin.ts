import { IAdminController, Storable, SAMLSSORecord, OIDCSSORecord } from '../typings';
import { transformConnections } from './utils';

export class AdminController implements IAdminController {
  connectionStore: Storable;

  constructor({ connectionStore }) {
    this.connectionStore = connectionStore;
  }

  public async getAllConnection(pageOffset?: number, pageLimit?: number) {
    const connectionList = (await this.connectionStore.getAll(pageOffset, pageLimit)) satisfies Array<
      SAMLSSORecord | OIDCSSORecord
    >;

    if (!connectionList || !connectionList.length) {
      return [];
    }

    return transformConnections(connectionList);
  }
}
