import { DynamoDB } from 'aws-sdk';
import { CreateTableInput } from 'aws-sdk/clients/dynamodb';
export type MockDynamoDBConfig = {
    tables: {
        Properties: CreateTableInput;
    }[];
};
export declare function createAndUpdateTable(dynamoDbClient: DynamoDB, config: MockDynamoDBConfig): Promise<void>;
export declare function configureDDBDataSource(config: any, ddbConfig: any): any;
//# sourceMappingURL=index.d.ts.map