import { MigrationInterface, QueryRunner } from "typeorm"
import { Collection, Db, MongoClient, UpdateOptions } from 'mongodb';


export class nameSpaceUpdate1648661645038 implements MigrationInterface {
    name = 'nameSpaceUpdate1648661645038'
    private url = 'postgresql://postgres:postgres@localhost:5432/postgres'
    
    
    private client!: MongoClient;
    private collection!: Collection;
    private db!: Db;

    public async up(queryRunner: QueryRunner): Promise<void> {
        this.client = new MongoClient(this.url);
        await this.client.connect();
        this.db = this.client.db();
        this.collection = this.db.collection('jacksonStore');
        const response = await this.collection.distinct('_id', {});
        const searchTerm = ':';
        for (const k in response) {
            const key = response[k].toString();
            const tokens2 = key.split(searchTerm).slice(0, 2);
            const value = tokens2.join(searchTerm); 
            await this.collection.updateOne(
                { _id: key },
                { $set: { nameSpace: value } },
                function (err: any, result: any) {
                    if (err) {
                        console.log(err);
                    }
                }
            );
        }
        this.client.close();
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        this.client = new MongoClient(this.url);
        await this.client.connect();
        this.db = this.client.db();
        this.collection = this.db.collection('jacksonStore');
        const response = await this.collection.distinct('_id', {});
        for (const k in response) {
            const key = response[k].toString();
            await this.collection.updateOne(
                { _id: key },
                { $set: { nameSpace: '' } },
                function (err: any, result: any) {
                if (err) {
                    console.log(err);
                }
                }
            );
        }
        this.client.close();
    }

}
