import { MigrationInterface, QueryRunner } from "typeorm";

export class msNamespace1688036519383 implements MigrationInterface {
    name = 'msNamespace1688036519383'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const columns = await queryRunner.query(`SELECT * FROM information_schema.columns WHERE table_name = 'jackson_store';`);
        if (columns.filter((c) => c.COLUMN_NAME === "namespace").length === 0) {
            await queryRunner.query(`ALTER TABLE \`jackson_store\` ADD \`namespace\` varchar(64) NULL`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`jackson_store\` DROP COLUMN \`namespace\``);
    }

}
