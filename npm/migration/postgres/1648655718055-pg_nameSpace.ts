import { MigrationInterface, QueryRunner } from "typeorm";

export class pgNameSpace1648655718055 implements MigrationInterface {
    name = 'pgNameSpace1648655718055'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "jackson_store" ADD "nameSpace" character varying(64)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "jackson_store" DROP COLUMN "nameSpace"`);
    }

}
