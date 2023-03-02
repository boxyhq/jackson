import {
  BatchGetItemCommand,
  CreateTableCommand,
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
  UpdateTimeToLiveCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall, NativeAttributeValue } from '@aws-sdk/util-dynamodb';
import { DatabaseDriver, DatabaseOption, Encrypted, Index } from '../typings';
import * as dbutils from './utils';

const getSeconds = (date: Date) => Math.floor(date.getTime() / 1000);

class DynamoDB implements DatabaseDriver {
  private options: DatabaseOption;
  private client!: DynamoDBClient;
  private tableName!: string;
  private indexTableName!: string;

  constructor(options: DatabaseOption) {
    this.options = options;
    this.tableName = 'jacksonStore';
    this.indexTableName = 'jacksonIndex';
  }

  async init(): Promise<DynamoDB> {
    this.client = new DynamoDBClient({ endpoint: this.options.url });
    try {
      await this.client.send(
        new CreateTableCommand({
          KeySchema: [
            {
              AttributeName: 'namespace',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'key',
              KeyType: 'RANGE',
            },
          ],
          AttributeDefinitions: [
            {
              AttributeName: 'namespace',
              AttributeType: 'S',
            },
            {
              AttributeName: 'key',
              AttributeType: 'S',
            },
            // {
            //   AttributeName: 'value',
            //   AttributeType: 'B',
            // },
            // {
            //   AttributeName: 'iv',
            //   AttributeType: 'B',
            // },
            // {
            //   AttributeName: 'tag',
            //   AttributeType: 'B',
            // },
            // {
            //   AttributeName: 'createdAt',
            //   AttributeType: 'S',
            // },
            // {
            //   AttributeName: 'modifiedAt',
            //   AttributeType: 'S',
            // },
          ],
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
          TableName: this.tableName,
        })
      );
      await this.client.send(
        new UpdateTimeToLiveCommand({
          TableName: this.tableName,
          TimeToLiveSpecification: {
            AttributeName: 'expiresAt',
            Enabled: true,
          },
        })
      );
    } catch (error: any) {
      if (!error?.message?.includes('Cannot create preexisting table')) {
        throw error;
      }
    }

    // TODO: create index table

    return this;
  }

  async get(namespace: string, key: string): Promise<any> {
    const res = await this.client.send(
      new GetItemCommand({ Key: marshall({ namespace, key }), TableName: this.tableName })
    );

    // Double check that the item has not expired
    const now = getSeconds(new Date());

    const item = res.Item ? unmarshall(res.Item) : null;

    if (item?.expiresAt < now) {
      return null;
    }

    if (item && item.value) {
      return JSON.parse(item.value);
    }

    return null;
  }

  async getAll(namespace: string, pageOffset?: number, pageLimit?: number): Promise<unknown[]> {
    const res = await this.client.send(
      new QueryCommand({
        KeyConditionExpression: 'namespace = :namespace',
        ExpressionAttributeValues: marshall({ namespace }),
        TableName: this.tableName,
        Limit: pageLimit,
      })
    );

    console.log(pageOffset, res);

    return [];
  }

  async getByIndex(namespace: string, idx: Index, offset?: number, limit?: number): Promise<any> {
    console.log(namespace, idx, offset, limit);
    // const docs =
    //   dbutils.isNumeric(offset) && dbutils.isNumeric(limit)
    //     ? await this.collection
    //         .find(
    //           {
    //             indexes: dbutils.keyForIndex(namespace, idx),
    //           },
    //           { sort: { createdAt: -1 }, skip: offset, limit: limit }
    //         )
    //         .toArray()
    //     : await this.collection
    //         .find({
    //           indexes: dbutils.keyForIndex(namespace, idx),
    //         })
    //         .toArray();
    // const ret: string[] = [];
    // for (const doc of docs || []) {
    //   ret.push(doc.value);
    // }
    // return ret;
    return [];
  }

  async put(namespace: string, key: string, val: Encrypted, ttl = 0, ...indexes: any[]): Promise<void> {
    console.log(indexes);
    const now = getSeconds(new Date());
    const doc: Record<string, NativeAttributeValue> = {
      namespace,
      key,
      value: JSON.stringify(val),
      createdAt: now,
    };

    if (ttl) {
      const ttlDate = new Date(Date.now() + ttl * 1000);
      doc.expiresAt = getSeconds(ttlDate);
    }

    await this.client.send(
      new PutItemCommand({
        TableName: this.tableName,
        Item: marshall(doc),
      })
    );
  }

  async delete(namespace: string, key: string): Promise<any> {
    const res = await this.client.send(
      new DeleteItemCommand({ TableName: this.tableName, Key: marshall({ namespace, key }) })
    );

    return res;
  }
}

export default {
  new: async (options: DatabaseOption): Promise<DynamoDB> => {
    return await new DynamoDB(options).init();
  },
};
