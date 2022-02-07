import { MigrationInterface, QueryRunner } from 'typeorm';

export class createdAt1643991066424 implements MigrationInterface {
  name = 'createdAt1643991066424';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "jackson_store" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT 'now()'`
    );
    await queryRunner.query(`ALTER TABLE "jackson_store" ADD "modifiedAt" TIMESTAMP WITH TIME ZONE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "jackson_store" DROP COLUMN "modifiedAt"`);
    await queryRunner.query(`ALTER TABLE "jackson_store" DROP COLUMN "createdAt"`);
  }
}
