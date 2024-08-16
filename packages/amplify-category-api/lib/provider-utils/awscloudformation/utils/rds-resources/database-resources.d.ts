import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { RDSConnectionSecrets, ImportedRDSType } from '@aws-amplify/graphql-transformer-core';
import { SqlModelDataSourceSsmDbConnectionConfig } from '@aws-amplify/graphql-transformer-interfaces';
export declare const getVpcMetadataLambdaName: (appId: string, envName: string) => string;
export declare const getExistingConnectionSecrets: (context: $TSContext, secretsKey: string, apiName: string, envName?: string) => Promise<RDSConnectionSecrets | undefined>;
export declare const getExistingConnectionDbConnectionConfig: (apiName: string, secretsKey: string) => SqlModelDataSourceSsmDbConnectionConfig;
export declare const getExistingConnectionSecretNames: (context: $TSContext, apiName: string, secretsKey: string, envName?: string) => Promise<RDSConnectionSecrets | undefined>;
export declare const storeConnectionSecrets: (context: $TSContext, secrets: RDSConnectionSecrets, apiName: string, secretsKey: string) => Promise<void>;
export declare const deleteConnectionSecrets: (context: $TSContext, secretsKey: string, apiName: string, envName?: string) => Promise<void>;
export declare const testDatabaseConnection: (config: RDSConnectionSecrets) => Promise<boolean>;
export declare const getSecretsKey: () => string;
export declare const getDatabaseName: (context: $TSContext, apiName: string, secretsKey: string) => Promise<string | undefined>;
export declare const deleteSchemaInspectorLambdaRole: (lambdaName: string) => Promise<void>;
export declare const removeVpcSchemaInspectorLambda: (context: $TSContext) => Promise<void>;
export declare const getConnectionSecrets: (context: $TSContext, secretsKey: string, engine: ImportedRDSType) => Promise<{
    secrets: import("@aws-amplify/graphql-transformer-interfaces").TransformerSecrets & {
        username: string;
        password: string;
        host: string;
        database: string;
        port: number;
    } & {
        engine: ImportedRDSType;
    };
    storeSecrets: boolean;
}>;
//# sourceMappingURL=database-resources.d.ts.map