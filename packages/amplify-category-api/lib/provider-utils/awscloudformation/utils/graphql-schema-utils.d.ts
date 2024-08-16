import { ImportedDataSourceConfig } from '@aws-amplify/graphql-transformer-core';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
export declare const writeSchemaFile: (pathToSchemaFile: string, schemaString: string) => void;
export declare const generateRDSSchema: (context: $TSContext, databaseConfig: ImportedDataSourceConfig, pathToSchemaFile: string) => Promise<string>;
//# sourceMappingURL=graphql-schema-utils.d.ts.map