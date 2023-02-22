import {MigrationInterface, QueryRunner} from "typeorm";

export class createdAt1644332641078 implements MigrationInterface {
    name = 'createdAt1644332641078'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`jackson_store\` ADD \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE \`jackson_store\` ADD \`modifiedAt\` timestamp NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`jackson_store\` DROP COLUMN \`modifiedAt\``);
        await queryRunner.query(`ALTER TABLE \`jackson_store\` DROP COLUMN \`createdAt\``);
    }

}
