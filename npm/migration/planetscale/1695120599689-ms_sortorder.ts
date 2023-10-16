import { MigrationInterface, QueryRunner } from "typeorm";

export class MsSortorder1695120599689 implements MigrationInterface {
    name = 'MsSortorder1695120599689'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // await queryRunner.query(`ALTER TABLE \`jackson_index\` DROP FOREIGN KEY \`FK_937b040fb2592b4671cbde09e83\``);
        await queryRunner.query(`ALTER TABLE \`jackson_store\` CHANGE \`createdAt\` \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`jackson_store\` CHANGE \`modifiedAt\` \`modifiedAt\` timestamp(6) NULL`);
        // await queryRunner.query(`CREATE INDEX \`_jackson_index_store\` ON \`jackson_index\` (\`storeKey\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // await queryRunner.query(`DROP INDEX \`_jackson_index_store\` ON \`jackson_index\``);
        await queryRunner.query(`ALTER TABLE \`jackson_store\` CHANGE \`modifiedAt\` \`modifiedAt\` timestamp(0) NULL`);
        await queryRunner.query(`ALTER TABLE \`jackson_store\` CHANGE \`createdAt\` \`createdAt\` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP`);
        // await queryRunner.query(`ALTER TABLE \`jackson_index\` ADD CONSTRAINT \`FK_937b040fb2592b4671cbde09e83\` FOREIGN KEY (\`storeKey\`) REFERENCES \`jackson_store\`(\`key\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
