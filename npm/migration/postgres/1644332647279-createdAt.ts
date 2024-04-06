import {MigrationInterface, QueryRunner} from "typeorm";

const schema = process.env.POSTGRES_SCHEMA || "public";
const jacksonStoreTableName = `${schema}.jackson_store`;

export class createdAt1644332647279 implements MigrationInterface {
    name = 'createdAt1644332647279'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE ${jacksonStoreTableName} ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE ${jacksonStoreTableName} ADD "modifiedAt" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE ${jacksonStoreTableName} DROP COLUMN "modifiedAt"`);
        await queryRunner.query(`ALTER TABLE ${jacksonStoreTableName} DROP COLUMN "createdAt"`);
    }

}
