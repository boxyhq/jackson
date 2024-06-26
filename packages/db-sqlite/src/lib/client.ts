import {drizzle, LibSQLDatabase} from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'

import * as jacksonTables from './schema/tables'
import type { SQLiteTable } from 'drizzle-orm/sqlite-core'
import { getTableColumns, SQL, sql } from 'drizzle-orm'
import {migrate} from "drizzle-orm/libsql/migrator";

export type * from './schema/tables'

export const schema = { ...jacksonTables }

export { sqliteTable as tableCreator } from './schema/_table'

export * from 'drizzle-orm'

export type CreateDbOptions = {
    url: string;
    authToken?: string;
    logger?: boolean
}

export type SqliteDb = LibSQLDatabase<typeof schema>

export const createDb = (opts: CreateDbOptions): {db: SqliteDb, closeConnection: () => void} => {
    if (opts.logger === undefined) {
        opts.logger = process.env.NODE_ENV !== 'production'
    }
    const sqliteClient = createClient({
        url: opts.url,
        authToken: opts.authToken,
    })

    return {
        db: drizzle(sqliteClient, {
            schema,
            logger: opts.logger,
        }),
        closeConnection: () => {
            return sqliteClient.close()
        }
    }
}

export const migrateSchema = async (db: SqliteDb, migrationsFolder: string = './drizzle') => {
    await migrate(db, { migrationsFolder });
}

export const buildConflictUpdateColumns = <
    T extends SQLiteTable,
    Q extends keyof T['_']['columns'],
>(
    table: T,
    columns: Q[],
) => {
    const cls = getTableColumns(table)
    return columns.reduce(
        (acc, column) => {
            const colName = cls[column].name
            acc[column] = sql.raw(`excluded.${colName}`)
            return acc
        },
        {} as Record<Q, SQL>,
    )
}
