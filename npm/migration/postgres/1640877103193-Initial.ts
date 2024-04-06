import {MigrationInterface, QueryRunner} from "typeorm";

const schema = process.env.POSTGRES_SCHEMA || "public";
const jacksonStoreTableName = `${schema}.jackson_store`;
const jacksonIndexTableName = `${schema}.jackson_index`;
const jacksonTTLTableName = `${schema}.hackson_ttl`;

export class Initial1640877103193 implements MigrationInterface {
    name = 'Initial1640877103193'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE ${jacksonStoreTableName} ("key" character varying(1500) NOT NULL, "value" text NOT NULL, "iv" character varying(64), "tag" character varying(64), CONSTRAINT "PK_87b6fc1475fbd1228d2f53c6f4a" PRIMARY KEY ("key"))`);
        await queryRunner.query(`CREATE TABLE ${jacksonIndexTableName} ("id" SERIAL NOT NULL, "key" character varying(1500) NOT NULL, "storeKey" character varying(1500) NOT NULL, CONSTRAINT "PK_a95aa83f01e3c73e126856b7820" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "_jackson_index_key" ON ${jacksonIndexTableName} ("key") `);
        await queryRunner.query(`CREATE INDEX "_jackson_index_key_store" ON ${jacksonIndexTableName} ("key", "storeKey") `);
        await queryRunner.query(`CREATE TABLE ${jacksonTTLTableName} ("key" character varying(1500) NOT NULL, "expiresAt" bigint NOT NULL, CONSTRAINT "PK_7c9bcdfb4d82e873e19935ec806" PRIMARY KEY ("key"))`);
        await queryRunner.query(`CREATE INDEX "_jackson_ttl_expires_at" ON ${jacksonTTLTableName} ("expiresAt") `);
        await queryRunner.query(`ALTER TABLE ${jacksonIndexTableName} ADD CONSTRAINT "FK_937b040fb2592b4671cbde09e83" FOREIGN KEY ("storeKey") REFERENCES ${jacksonStoreTableName}("key") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE ${jacksonIndexTableName} DROP CONSTRAINT "FK_937b040fb2592b4671cbde09e83"`);
        await queryRunner.query(`DROP INDEX ${schema}."_jackson_ttl_expires_at"`);
        await queryRunner.query(`DROP TABLE ${jacksonTTLTableName}`);
        await queryRunner.query(`DROP INDEX ${schema}."_jackson_index_key_store"`);
        await queryRunner.query(`DROP INDEX ${schema}."_jackson_index_key"`);
        await queryRunner.query(`DROP TABLE ${jacksonIndexTableName}`);
        await queryRunner.query(`DROP TABLE ${jacksonStoreTableName}`);
    }
}
