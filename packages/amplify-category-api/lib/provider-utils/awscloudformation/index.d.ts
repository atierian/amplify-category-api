import { $TSContext } from '@aws-amplify/amplify-cli-core';
export declare function addAdminQueriesApi(context: $TSContext, apiProps: {
    apiName: string;
    functionName: string;
    authResourceName: string;
    dependsOn: Record<string, any>[];
}): Promise<void>;
export declare function updateAdminQueriesApi(context: $TSContext, apiProps: {
    apiName: string;
    functionName: string;
    authResourceName: string;
    dependsOn: Record<string, any>[];
}): Promise<void>;
export declare function console(context: $TSContext, service: string): Promise<any>;
export declare function addResource(context: $TSContext, service: string, options: any): Promise<any>;
export declare function updateResource(context: $TSContext, category: string, service: string, options: any): Promise<string | void>;
export declare function migrateResource(context: $TSContext, projectPath: string, service: string, resourceName: string): Promise<any>;
export declare function addDatasource(context: $TSContext, category: any, datasource: any): Promise<any>;
export declare function getPermissionPolicies(context: $TSContext, service: string, resourceName: string, crudOptions: any): Promise<any>;
//# sourceMappingURL=index.d.ts.map