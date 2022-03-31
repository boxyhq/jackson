import { MigrationInterface, QueryRunner } from "typeorm";

export class pgNamespace1648655718055 implements MigrationInterface {
    name = 'pgNamespace1648655718055'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "jackson_store" ADD "namespace" character varying(64)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "jackson_store" DROP COLUMN "namespace"`);
    }

}
