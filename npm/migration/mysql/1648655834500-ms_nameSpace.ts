import { MigrationInterface, QueryRunner } from "typeorm";

export class msNameSpace1648655834500 implements MigrationInterface {
    name = 'msNameSpace1648655834500'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`jackson_store\` ADD \`nameSpace\` varchar(64) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`jackson_store\` DROP COLUMN \`nameSpace\``);
    }

}
