import type { SCIMConfig, SCIMEventType } from '../typings';
import { SCIMController } from './scim';
import { UsersController } from './users';
import { sendEvent } from '../scim';

export class SCIMUsers {
  private directory: any;
  private _users: InstanceType<typeof UsersController>;
  private _config: InstanceType<typeof SCIMController>;

  constructor({ scimController, usersController }) {
    this._users = usersController;
    this._config = scimController;
  }

  private users() {
    return this._users;
  }

  private config() {
    return this._config;
  }

  public async getDirectory(directoryId: string): Promise<SCIMConfig> {
    return this.directory || (this.directory = await this.config().get(directoryId));
  }

  public async create({ directory: directoryId, data }: { directory: string; data: any }) {
    const { tenant, product, webhook } = await this.getDirectory(directoryId);
    const { name, emails } = data.body;

    const user = await this.users().with(tenant, product).create({
      first_name: name.givenName,
      last_name: name.familyName,
      email: emails[0].value,
      raw: data.body,
    });

    sendEvent({
      action: 'user.created',
      payload: {
        tenant,
        product,
        data: user,
      },
      options: {
        webhook,
      },
    });

    return user.raw;
  }

  public async get({ directory: directoryId, data }: { directory: string; data: any }) {
    const { tenant, product } = await this.getDirectory(directoryId);
    const { user_id: userId } = data;

    const user = await this.users().with(tenant, product).get(userId);

    if (user === null) {
      return {
        schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
        detail: 'User not found',
        status: 404,
      };
    }

    return user.raw;
  }

  public async update({ directory: directoryId, data }: { directory: string; data: any }) {
    const { tenant, product, webhook } = await this.getDirectory(directoryId);
    const { user_id: userId } = data;
    const { name, emails, active } = data.body;

    let user = await this.users().with(tenant, product).get(userId);

    if (user === null) {
      return {
        schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
        detail: 'User not found',
        status: 404,
      };
    }

    const action: SCIMEventType = active ? 'user.updated' : 'user.deleted';

    if (action === 'user.updated') {
      user = await this.users().with(tenant, product).update(userId, {
        first_name: name.givenName,
        last_name: name.familyName,
        email: emails[0].value,
        raw: data.body,
      });
    } else if (action === 'user.deleted') {
      await this.users().with(tenant, product).delete(userId);
    }

    sendEvent({
      action,
      payload: {
        tenant,
        product,
        data: user,
      },
      options: {
        webhook,
      },
    });

    return user.raw;
  }

  public async delete({ directory: directoryId, data }: { directory: string; data: any }) {
    const { tenant, product, webhook } = await this.getDirectory(directoryId);
    const { user_id: userId } = data;

    const user = await this.users().with(tenant, product).get(userId);

    if (user === null) {
      return {
        schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
        detail: 'User not found',
        status: 404,
      };
    }

    await this.users().with(tenant, product).delete(userId);

    sendEvent({
      action: 'user.deleted',
      payload: {
        tenant,
        product,
        data: user,
      },
      options: {
        webhook,
      },
    });

    return user.raw;
  }
}
