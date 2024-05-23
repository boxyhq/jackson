/*eslint no-constant-condition: ["error", { "checkLoops": false }]*/

import {asc, desc, eq, inArray, count} from "drizzle-orm";

require('reflect-metadata');

import {
    DatabaseDriver,
    Index,
    Encrypted,
    Records,
    SortOrder,
} from '@boxyhq/saml-jackson';
import * as dbutils from '../../db-utils/src/lib/utils';
import {buildConflictUpdateColumns, createDb, migrateSchema, schema, SqliteDb} from "./lib/client";

export interface DatabaseOption {
    url: string;
    authToken?: string;
    ttl?: number;
    cleanupLimit?: number;
    pageLimit?: number;
    manualMigration?: boolean;
    logger?: boolean;
}

class Sql implements DatabaseDriver {
    private options: DatabaseOption;
    private db: SqliteDb;
    private ttlCleanup: () => void;
    private timerId: string | number | NodeJS.Timeout | undefined;
    private closeConnection: () => void;

    constructor(options: DatabaseOption) {
        this.options = options;
        const {db, closeConnection} = createDb({
            url: this.options.url,
            logger: this.options.logger,
            authToken: this.options.authToken
        })
        this.db = db
        this.closeConnection = closeConnection

        if (!this.options.manualMigration) {
            (async () => {
                while (true) {
                    try {
                        await migrateSchema(db);
                        break;
                    } catch (err) {
                        console.error(
                            `error in database migration execution for engine: sqlite err: ${err}`
                        );
                        await dbutils.sleep(1000);
                        continue;
                    }
                }
            })();

            // kick off indexing
            (async () => {
                while (true) {
                    try {
                        await this.indexNamespace();
                        break;
                    } catch (err) {
                        console.error(
                            `error in index namespace execution for engine: sqlite err: ${err}`
                        );
                        await dbutils.sleep(1000);
                        continue;
                    }
                }
            })()

        }

        if (this.options.ttl && this.options.cleanupLimit) {
            this.ttlCleanup = async () => {
                const now = new Date();

                while (true) {
                    const ids = await this.db.query.jacksonTtl.findMany({
                        columns: {key: true},
                        where: (t, {lte}) => lte(t.expiresAt, now),
                        limit: this.options.cleanupLimit
                    })

                    if (ids.length <= 0) {
                        break;
                    }

                    const delIds = ids.map((id) => {
                        return id.key;
                    });

                    await this.db.transaction(async tx => {
                        await tx.delete(schema.jacksonStore).where(inArray(schema.jacksonStore.key, delIds))
                        await tx.delete(schema.jacksonTtl).where(inArray(schema.jacksonTtl.key, delIds))
                    })
                }

                this.timerId = setTimeout(this.ttlCleanup, this.options.ttl! * 1000);
            };

            this.timerId = setTimeout(this.ttlCleanup, this.options.ttl! * 1000);
        } else {
            console.warn(
                'Warning: ttl cleanup not enabled, set both "ttl" and "cleanupLimit" options to enable it!'
            );
            this.ttlCleanup = () => {} // no-op
        }
    }

    async indexNamespace() {
        const res = await this.db.query.jacksonStore.findMany({
            columns: { key: true },
            where: (t, {isNull}) => isNull(t.namespace)
        })

        const searchTerm = ':';

        for (const r of res) {
            const key = r.key;
            const tokens2 = key.split(searchTerm).slice(0, 2);
            const value = tokens2.join(searchTerm);
            await this.db.update(schema.jacksonStore).set({
                namespace: value
            }).where(eq(schema.jacksonStore.key, key))
        }
    }

    async get(namespace: string, key: string): Promise<any> {
        const res = await this.db.query.jacksonStore.findFirst({
            where: (t, {eq}) => eq(t.key, dbutils.key(namespace, key))
        })

        if (res && res.value) {
            return {
                value: res.value,
                iv: res.iv,
                tag: res.tag,
            };
        }

        return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getAll(
        namespace: string,
        pageOffset?: number,
        pageLimit?: number,
        _?: string,
        sortOrder?: SortOrder
    ): Promise<Records> {
        const { offset: skip, limit: take } = dbutils.normalizeOffsetAndLimit({
            pageOffset,
            pageLimit,
            maxLimit: this.options.pageLimit!,
        });


        const sortFn = sortOrder && sortOrder === 'ASC' ? asc : desc
        const orderBy = [sortFn(schema.jacksonStore.createdAt)]
        const res = await this.db.query.jacksonStore.findMany({
            columns: {value: true, iv: true, tag: true},
            where: (t, {eq}) => eq(t.namespace, namespace),
            orderBy,
            offset: skip,
            limit: take,
        })

        return { data: res || [] };
    }

    async getByIndex(
        namespace: string,
        idx: Index,
        pageOffset?: number,
        pageLimit?: number,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _?: string,
        sortOrder?: SortOrder
    ): Promise<Records> {
        const { offset: skip, limit: take } = dbutils.normalizeOffsetAndLimit({
            pageOffset,
            pageLimit,
            maxLimit: this.options.pageLimit!,
        });

        const sortFn = sortOrder && sortOrder === 'ASC' ? asc : desc
        const res = await this.db.query.jacksonIndex.findMany({
            with: {
                store: true
            },
            where: (t, {eq}) => eq(t.key, dbutils.keyForIndex(namespace, idx)),
            offset: skip,
            limit: take,
            orderBy: [sortFn(schema.jacksonIndex.id)]
        })

        const ret: Encrypted[] = [];
        if (res) {
            for (const r of res) {
                const value = r.store;

                ret.push({
                    value: value.value,
                    iv: value.iv ?? undefined,
                    tag: value.tag ?? undefined,
                });
            }
        }

        return { data: ret };
    }

    async getCount(namespace: string, idx?: Index): Promise<number> {
        const entryCount =
            idx !== undefined
                ? await this.db.select({ count: count() }).from(schema.jacksonIndex).where(eq(schema.jacksonIndex.key, dbutils.keyForIndex(namespace, idx)))
                : await this.db.select({count: count() }).from(schema.jacksonStore).where(eq(schema.jacksonStore.namespace, namespace));
        return entryCount[0].count;
    }

    async put(namespace: string, key: string, val: Encrypted, ttl = 0, ...indexes: any[]): Promise<void> {
        const dbKey = dbutils.key(namespace, key);

        await this.db.transaction(async tx => {
            await tx.insert(schema.jacksonStore).values({
                key: dbKey,
                value: val.value,
                iv: val.iv,
                tag: val.tag,
                modifiedAt: new Date(),
                namespace,
            }).onConflictDoUpdate({
                target: schema.jacksonStore.key,
                set: buildConflictUpdateColumns(schema.jacksonStore, [
                    'iv',
                    'value',
                    'tag',
                    'modifiedAt',
                    'namespace'
                ]),
            });

            if (ttl) {
                await tx.insert(schema.jacksonTtl).values({
                    key: dbKey,
                    expiresAt: new Date(Date.now() + ttl * 1000)
                }).onConflictDoUpdate({
                    target: schema.jacksonTtl.key,
                    set: buildConflictUpdateColumns(schema.jacksonTtl, [
                        'expiresAt'
                    ])
                })
            }

            // no ttl support for secondary indexes
            for (const idx of indexes || []) {
                const key = dbutils.keyForIndex(namespace, idx);

                await tx.insert(schema.jacksonIndex).values({
                    key,
                    storeKey: dbKey
                }).onConflictDoNothing({
                    target: [schema.jacksonIndex.key, schema.jacksonIndex.storeKey]
                })
            }

        })
    }

    async delete(namespace: string, key: string): Promise<any> {
        const dbKey = dbutils.key(namespace, key);
        await this.db.delete(schema.jacksonTtl).where(eq(schema.jacksonTtl.key, dbKey))
        await this.db.delete(schema.jacksonIndex).where(eq(schema.jacksonIndex.storeKey, dbKey))

        return this.db.delete(schema.jacksonStore).where(eq(schema.jacksonStore.key, dbKey));
    }

    async deleteMany(namespace: string, keys: string[]): Promise<void> {
        if (keys.length === 0) {
            return;
        }

        const dbKeys = keys.map((key) => dbutils.key(namespace, key));

        await this.db.transaction(async tx => {
            await tx.delete(schema.jacksonTtl).where(inArray(schema.jacksonTtl.key, dbKeys))
            await tx.delete(schema.jacksonIndex).where(inArray(schema.jacksonIndex.storeKey, dbKeys))
            await tx.delete(schema.jacksonStore).where(inArray(schema.jacksonStore.key, dbKeys))
        })
    }

    async close() {
        clearTimeout(this.timerId)
        this.closeConnection()
    }
}



export const SqliteDB = {
    new: (options: DatabaseOption): Sql => {
        return new Sql(options);
    },
}

export default SqliteDB;
