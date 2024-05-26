import { MigrationInterface, QueryRunner } from "typeorm"

// This file is same as npm/migration/sql/1692817789888-namespace.ts,
// but, with the added postgres schema name. 

const schema = process.env.POSTGRES_SCHEMA || "public";
const jacksonStoreTableName = `${schema}.jackson_store`;

export class namespace1692817789888 implements MigrationInterface {
  name = 'namespace1692817789888'

  public async up(queryRunner: QueryRunner): Promise<void> {
    const response = await queryRunner.query(`select jackson.key from ${jacksonStoreTableName} jackson`)
      const searchTerm = ':';
      for (const k in response) {
        const key = response[k].key;
        const tokens2 = key.split(searchTerm).slice(0, 2);
        const value = tokens2.join(searchTerm);
        queryRunner.query(`update ${jacksonStoreTableName} set namespace = '${value}' where ${jacksonStoreTableName}.key = '${key}'`)
      }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
      const response = await queryRunner.query(`select jackson.key from ${jacksonStoreTableName} jackson`)
        for (const k in response) {
          const key = response[k].key;
          queryRunner.query(`update ${jacksonStoreTableName} set namespace = NULL where ${jacksonStoreTableName}.key = '${key}'`)
        }
  }
  
}
