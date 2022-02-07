import {MigrationInterface, QueryRunner} from "typeorm";

export class createdAt1644259251437 implements MigrationInterface {
    name = 'createdAt1644259251437'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "jackson_store" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "jackson_store" DROP COLUMN "modifiedAt"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "jackson_store" ADD "modifiedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "jackson_store" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
    }

}
