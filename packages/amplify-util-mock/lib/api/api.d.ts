export declare const GRAPHQL_API_ENDPOINT_OUTPUT = "GraphQLAPIEndpointOutput";
export declare const GRAPHQL_API_KEY_OUTPUT = "GraphQLAPIKeyOutput";
export declare const MOCK_API_KEY = "da2-fakeApiId123456";
export declare const MOCK_API_PORT = 20002;
export declare class APITest {
    private apiName;
    private transformerResult;
    private ddbClient;
    private appSyncSimulator;
    private resolverOverrideManager;
    private watcher;
    private ddbEmulator;
    private configOverrideManager;
    private apiParameters;
    private userOverriddenSlots;
    start(context: any, port?: number, wsPort?: number): Promise<void>;
    stop(context: any): Promise<void>;
    private runTransformer;
    private generateCode;
    private reload;
    private generateTestFrontendExports;
    private ensureDDBTables;
    private configureLambdaDataSource;
    private watch;
    private configureDDBDataSource;
    private getAppSyncAPI;
    private startDynamoDBLocalServer;
    private getAPIBackendDirectory;
    private getAPIParameterFilePath;
    private loadAPIParameters;
    private getResolverTemplateDirectory;
    private registerWatcher;
    private generateFrontendExports;
}
//# sourceMappingURL=api.d.ts.map