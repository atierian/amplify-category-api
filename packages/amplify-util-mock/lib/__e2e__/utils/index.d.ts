import { AmplifyAppSyncSimulator } from '@aws-amplify/amplify-appsync-simulator';
import { DynamoDB } from 'aws-sdk';
import { ExecuteTransformConfig } from '@aws-amplify/graphql-transformer';
import { DeploymentResources } from '@aws-amplify/graphql-transformer-test-utils';
import { ModelDataSourceStrategy } from '@aws-amplify/graphql-transformer-interfaces';
export * from './graphql-client';
export declare const transformAndSynth: (options: Omit<ExecuteTransformConfig, 'scope' | 'nestedStackProvider' | 'assetProvider' | 'synthParameters' | 'dataSourceStrategies'> & {
    dataSourceStrategies?: Record<string, ModelDataSourceStrategy>;
}) => DeploymentResources;
export declare const defaultTransformParams: Pick<ExecuteTransformConfig, 'transformersFactoryArgs' | 'transformParameters'>;
export declare function launchDDBLocal(): Promise<{
    emulator: any;
    dbPath: any;
    client: DynamoDB;
}>;
export declare function deploy(transformerOutput: any, client?: DynamoDB): Promise<{
    config: any;
    simulator: AmplifyAppSyncSimulator;
}>;
export declare function reDeploy(transformerOutput: any, simulator: AmplifyAppSyncSimulator, client?: DynamoDB): Promise<{
    config: any;
    simulator: AmplifyAppSyncSimulator;
}>;
export declare function terminateDDB(emulator: any, dbPath: any): Promise<void>;
export declare function runAppSyncSimulator(config: any, port?: number, wsPort?: number): Promise<AmplifyAppSyncSimulator>;
export declare function logDebug(...msgs: any[]): void;
//# sourceMappingURL=index.d.ts.map