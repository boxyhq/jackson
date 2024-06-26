import { sqliteTable } from './_table'
import {index, integer, text, uniqueIndex} from 'drizzle-orm/sqlite-core'
import {relations, sql} from 'drizzle-orm'

export const jacksonStore = sqliteTable(
    'jackson_store',
    {
        key: text('key', { length: 1500 }).primaryKey().notNull(),
        value: text('value').notNull(),
        iv: text('iv', { length: 64 }),
        tag: text('tag', { length: 64 }),
        createdAt: integer('createdAt', { mode: 'timestamp_ms' })
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
        modifiedAt: integer('modifiedAt', { mode: 'timestamp_ms' }),
        namespace: text('namespace', { length: 256 }),
    },
    (table) => {
        return {
            jacksonStoreNamespace: index('_jackson_store_namespace').on(
                table.namespace,
            ),
        }
    },
)

export type JacksonStore = typeof jacksonStore.$inferSelect

export const jacksonIndex = sqliteTable(
    'jackson_index',
    {
        id: integer('id').primaryKey().notNull(),
        key: text('key', { length: 1500 }).notNull(),
        storeKey: text('storeKey', { length: 1500 })
            .notNull()
            .references(() => jacksonStore.key, { onDelete: 'cascade' }),
    },
    (table) => {
        return {
            jacksonIndexKey: index('_jackson_index_key').on(table.key),
            jacksonIndexKeyStore: uniqueIndex('_jackson_index_key_store').on(
                table.key,
                table.storeKey,
            ),
        }
    },
)

export type JacksonIndex = typeof jacksonIndex.$inferSelect

export const indexRelations = relations(jacksonIndex, ({ one }) => ({
    store: one(jacksonStore, {
        fields: [jacksonIndex.storeKey],
        references: [jacksonStore.key]
    }),
}));

export const jacksonTtl = sqliteTable(
    'jackson_ttl',
    {
        key: text('key', { length: 1500 }).primaryKey().notNull(),
        expiresAt: integer('expiresAt', { mode: 'timestamp_ms' }).notNull(),
    },
    (table) => {
        return {
            jacksonTtlExpiresAt: index('_jackson_ttl_expires_at').on(table.expiresAt),
        }
    },
)

export type JacksonTTL = typeof jacksonTtl.$inferSelect