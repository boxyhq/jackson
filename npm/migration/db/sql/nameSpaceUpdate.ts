import { MigrationInterface, QueryRunner } from "typeorm"

export class nameSpaceUpdate1648657197587 implements MigrationInterface {
    name = 'nameSpaceUpdate1648657197587'
    public async up(queryRunner: QueryRunner): Promise<void> {
        const response = await queryRunner.query("select jackson.key from jackson_store jackson")
        const responseJson = JSON.parse(JSON.stringify(response));
          const searchTerm = ':';
          for (const k in responseJson) {
            const key = responseJson[k].key;
            const tokens2 = key.split(searchTerm).slice(0, 2);
            const value = tokens2.join(searchTerm);
            queryRunner.query("update jackson_store set nameSpace = ? where key = ?" , [value, key])
          }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const response = await queryRunner.query("select jackson.key from jackson_store jackson")
        const responseJson = JSON.parse(JSON.stringify(response));
          for (const k in responseJson) {
            const key = responseJson[k].key;
            queryRunner.query("update jackson_store set nameSpace = ? where key = ?" , ['NULL', key])
          }
    }

}
