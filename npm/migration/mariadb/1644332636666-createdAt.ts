import { MigrationInterface, QueryRunner } from "typeorm";

export class createdAt1644332636666 implements MigrationInterface {
    name = 'createdAt1644332636666'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const columns = await queryRunner.query(`SELECT * FROM information_schema.columns WHERE table_name = 'jackson_store';`);
        if (columns.filter((c) => c.column_name === "createdAt").length === 0) {
            await queryRunner.query(`ALTER TABLE \`jackson_store\` ADD \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP()`);
        }
        if (columns.filter((c) => c.column_name === "modifiedAt").length === 0) {
            await queryRunner.query(`ALTER TABLE \`jackson_store\` ADD \`modifiedAt\` timestamp NULL`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`jackson_store\` DROP COLUMN \`modifiedAt\``);
        await queryRunner.query(`ALTER TABLE \`jackson_store\` DROP COLUMN \`createdAt\``);
    }

}
