import { AmplifyAppSyncSimulatorConfig } from '@aws-amplify/amplify-appsync-simulator';
export declare function processApiResources(resources: Record<string, {
    Type: string;
    result: any;
}>, transformResult: any, appSyncConfig: AmplifyAppSyncSimulatorConfig): void;
export declare function processCloudFormationResults(resources: any, transformResult: any): AmplifyAppSyncSimulatorConfig;
export declare function processTransformerStacks(transformResult: any, params?: {}): AmplifyAppSyncSimulatorConfig;
//# sourceMappingURL=appsync-resource-processor.d.ts.map