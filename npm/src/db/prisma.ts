/*eslint no-constant-condition: ["error", { "checkLoops": false }]*/

import * as dbutils from './utils';

require('reflect-metadata');

import { PrismaClient, PrismaPromise } from '@prisma/client';
import { DatabaseDriver, DatabaseOption, Encrypted, Index } from '../typings';
import Env from '../../../lib/env';

class PrismaSql implements DatabaseDriver {
  private options: DatabaseOption;
  private client!: PrismaClient;
  private timerId;

  constructor(options: DatabaseOption) {
    this.options = options;
  }

  private async _ttlCleanup() {
    const now = Date.now();

    while (true) {
      const ids = await this.client.ttl.findMany({
        where: {
          expiresAt: {
            lte: now,
          },
        },
        select: {
          key: true,
        },
        take: this.options.cleanupLimit,
      });

      if (ids.length <= 0) {
        break;
      }

      const delIds = ids.map((id) => {
        return id.key;
      });

      await this.client.store.deleteMany({
        where: {
          key: {
            in: delIds,
          },
        },
      });
      await this.client.ttl.deleteMany({
        where: {
          key: {
            in: delIds,
          },
        },
      });
    }

    this.timerId = setTimeout(this._ttlCleanup, this.options.ttl! * 1000);
  }

  async init(): Promise<PrismaSql> {
    while (true) {
      try {
        this.client = new PrismaClient({
          log: ['query', 'info'],
          datasources: {
            db: {
              url: this.options.url, // set
            },
          },
        });
        // TODO run migrations on database
        break;
      } catch (err) {
        console.error(`error connecting to ${this.options.type} db: ${err}`);
        await dbutils.sleep(1000);
        continue;
      }
    }

    if (this.options.ttl && this.options.cleanupLimit) {
      this.timerId = setTimeout(this._ttlCleanup, this.options.ttl! * 1000);
    } else {
      console.log(
        'Warning: ttl cleanup not enabled, set both "ttl" and "cleanupLimit" options to enable it!'
      );
    }

    return this;
  }

  async delete(namespace: string, key: string): Promise<Encrypted | null> {
    const dbKey = dbutils.key(namespace, key);
    await this.client.ttl.delete({
      where: {
        key: dbKey,
      },
    });
    const store = await this.client.store.delete({
      where: {
        key: dbKey,
      },
    });
    if (!store) {
      return null;
    }
    return {
      value: store.value,
      iv: store.iv ?? undefined, // translate from null to expected undefined
      tag: store.tag ?? undefined,
    };
  }

  async get(namespace: string, key: string): Promise<Encrypted | null> {
    const store = await this.client.store.findFirst({
      where: {
        key: dbutils.key(namespace, key),
      },
    });
    if (!store) {
      return null;
    }
    return {
      value: store.value,
      iv: store.iv ?? undefined, // translate from null to expected undefined
      tag: store.tag ?? undefined,
    };
  }

  async getAll(namespace: string, pageOffset?: number, pageLimit?: number): Promise<Encrypted[]> {
    const offsetAndLimitValueCheck = !dbutils.isNumeric(pageOffset) && !dbutils.isNumeric(pageLimit);
    const stores = await this.client.store.findMany({
      where: {
        key: {
          contains: namespace,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        value: true,
        iv: true,
        tag: true,
      },
      take: offsetAndLimitValueCheck ? this.options.pageLimit : pageLimit,
      skip: offsetAndLimitValueCheck ? 0 : pageOffset,
    });
    return stores.map((s) => ({
      value: s.value,
      iv: s.iv ?? undefined, // translate from null to expected undefined
      tag: s.tag ?? undefined,
    }));
  }

  async getByIndex(namespace: string, idx: Index): Promise<Encrypted[]> {
    const indices = await this.client.index.findMany({
      where: {
        key: dbutils.keyForIndex(namespace, idx),
      },
      include: {
        store: true,
      },
    });
    return indices.map((i) => ({
      value: i.store.value,
      iv: i.store.iv ?? undefined, // translate from null to expected undefined
      tag: i.store.tag ?? undefined,
    })); // FIXME this potentially returns the same store many times having an idx:store n:1?
  }

  async put(namespace: string, key: string, val: Encrypted, ttl = 0, ...indexes: Index[]): Promise<any> {
    const dbKey = dbutils.key(namespace, key);
    const tx: PrismaPromise<any>[] = [
      this.client.store.create({
        data: {
          key: dbKey,
          value: val.value,
          iv: val.iv,
          tag: val.tag,
          modifiedAt: new Date(),
          index: {
            createMany: {
              data: (indexes || []).map((idx) => ({
                key: dbutils.keyForIndex(namespace, idx),
                storeKey: dbKey,
              })),
            },
          },
        },
      }),
    ];
    if (ttl) {
      tx.push(
        this.client.ttl.create({
          data: {
            key: dbKey,
            expiresAt: Date.now() * ttl * 1000,
          },
        })
      );
    }
    await this.client.$transaction(tx);
  }
}

export default {
  new: async (options: DatabaseOption): Promise<PrismaSql> => {
    return await new PrismaSql(options).init();
  },
};
