import { MigrationInterface, QueryRunner } from "typeorm";

export class createdAt1644332641078 implements MigrationInterface {
    name = 'createdAt1644332641078'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const columns = await queryRunner.query(`SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='jackson_store';`);
        console.log(columns);
        if (columns.filter((c) => c.COLUMN_NAME === "createdAt").length === 0) {
            await queryRunner.query(`ALTER TABLE \`jackson_store\` ADD \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP`);
        }
        if (columns.filter((c) => c.COLUMN_NAME === "modifiedAt").length === 0) {
            await queryRunner.query(`ALTER TABLE \`jackson_store\` ADD \`modifiedAt\` timestamp NULL`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`jackson_store\` DROP COLUMN \`modifiedAt\``);
        await queryRunner.query(`ALTER TABLE \`jackson_store\` DROP COLUMN \`createdAt\``);
    }

}
