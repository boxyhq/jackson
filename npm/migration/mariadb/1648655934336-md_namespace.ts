import { MigrationInterface, QueryRunner } from "typeorm";

export class mdNamespace1648655934336 implements MigrationInterface {
    name = 'mdNamespace1648655934336'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`jackson_store\` ADD \`namespace\` varchar(64) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`jackson_store\` DROP COLUMN \`namespace\``);
    }

}
