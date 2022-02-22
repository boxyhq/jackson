import {MigrationInterface, QueryRunner} from "typeorm";

export class createdAt1644332647279 implements MigrationInterface {
    name = 'createdAt1644332647279'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "jackson_store" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "jackson_store" ADD "modifiedAt" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "jackson_store" DROP COLUMN "modifiedAt"`);
        await queryRunner.query(`ALTER TABLE "jackson_store" DROP COLUMN "createdAt"`);
    }

}
