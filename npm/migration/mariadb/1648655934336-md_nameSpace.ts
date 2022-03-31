import { MigrationInterface, QueryRunner } from "typeorm";

export class mdNameSpace1648655934336 implements MigrationInterface {
    name = 'mdNameSpace1648655934336'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`jackson_store\` ADD \`nameSpace\` varchar(64) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`jackson_store\` DROP COLUMN \`nameSpace\``);
    }

}
