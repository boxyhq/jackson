import { MigrationInterface, QueryRunner } from 'typeorm';

export class ModifycreatedAt1644247361768 implements MigrationInterface {
  name = 'ModifycreatedAt1644247361768';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "jackson_store" DROP COLUMN "createdAt"`);
    await queryRunner.query(`ALTER TABLE "jackson_store" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "jackson_store" DROP COLUMN "modifiedAt"`);
    await queryRunner.query(`ALTER TABLE "jackson_store" ADD "modifiedAt" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "jackson_store" DROP COLUMN "modifiedAt"`);
    await queryRunner.query(`ALTER TABLE "jackson_store" ADD "modifiedAt" TIMESTAMP WITH TIME ZONE`);
    await queryRunner.query(`ALTER TABLE "jackson_store" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "jackson_store" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT '2022-02-07 15:22:35.264846+00'`
    );
  }
}
