import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { ImportAppSyncAPIInputs, ImportedDataSourceType, ImportedDataSourceConfig } from '@aws-amplify/graphql-transformer-core';
export declare const importAppSyncAPIWalkthrough: (context: $TSContext) => Promise<ImportAppSyncAPIInputs>;
export declare const writeDefaultGraphQLSchema: (context: $TSContext, pathToSchemaFile: string, databaseConfig: ImportedDataSourceConfig) => Promise<void>;
export declare const formatEngineName: (engine: ImportedDataSourceType) => string;
//# sourceMappingURL=import-appsync-api-walkthrough.d.ts.map