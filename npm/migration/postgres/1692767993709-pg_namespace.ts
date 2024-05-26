import { MigrationInterface, QueryRunner } from "typeorm";

const schema = process.env.POSTGRES_SCHEMA || "public";
const jacksonStoreTableName = `${schema}.jackson_store`;

export class PgNamespace1692767993709 implements MigrationInterface {
    name = 'PgNamespace1692767993709'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE ${jacksonStoreTableName} ADD "namespace" character varying(64)`);
        await queryRunner.query(`CREATE INDEX "_jackson_store_namespace" ON ${jacksonStoreTableName} ("namespace") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX ${schema}."_jackson_store_namespace"`);
        await queryRunner.query(`ALTER TABLE ${jacksonStoreTableName} DROP COLUMN "namespace"`);
    }

}
