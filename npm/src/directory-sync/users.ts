import type { SCIMEventType } from '../typings';
import { UsersController } from '../controller/users';
import { sendEvent } from './events';
import { DirectoryConfig } from './config';

export class DirectoryUsers {
  private users: InstanceType<typeof UsersController>;
  private directory: InstanceType<typeof DirectoryConfig>;

  constructor({ directory, users }) {
    this.users = users;
    this.directory = directory;
  }

  public async create({ directory: directoryId, data }: { directory: string; data: any }) {
    const { tenant, product, webhook } = await this.directory.get(directoryId);
    const { name, emails } = data.body;

    const user = await this.users.with(tenant, product).create({
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
    const { tenant, product } = await this.directory.get(directoryId);
    const { user_id: userId } = data;

    const user = await this.users.with(tenant, product).get(userId);

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
    const { tenant, product, webhook } = await this.directory.get(directoryId);
    const { user_id: userId } = data;
    const { active, Operations } = data.body;

    let user = await this.users.with(tenant, product).get(userId);

    if (user === null) {
      return {
        schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
        detail: 'User not found',
        status: 404,
      };
    }

    let action: SCIMEventType = 'user.updated';

    // For PATCH
    if ('Operations' in data.body) {
      const operation = Operations[0];

      if (operation.op === 'replace' && operation.value.active === false) {
        action = 'user.deleted';
      }
    }

    // For PUT
    if ('active' in data.body) {
      action = active ? 'user.updated' : 'user.deleted';
    }

    if (action === 'user.updated') {
      const { name, emails } = data.body;

      user = await this.users.with(tenant, product).update(userId, {
        first_name: name.givenName,
        last_name: name.familyName,
        email: emails[0].value,
        raw: data.body,
      });
    } else if (action === 'user.deleted') {
      await this.users.with(tenant, product).delete(userId);
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
    const { tenant, product, webhook } = await this.directory.get(directoryId);
    const { user_id: userId } = data;

    const user = await this.users.with(tenant, product).get(userId);

    if (user === null) {
      return {
        schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
        detail: 'User not found',
        status: 404,
      };
    }

    await this.users.with(tenant, product).delete(userId);

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
