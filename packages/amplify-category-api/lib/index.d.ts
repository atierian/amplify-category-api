import { $TSContext } from '@aws-amplify/amplify-cli-core';
export { NETWORK_STACK_LOGICAL_ID } from './category-constants';
export { addAdminQueriesApi, updateAdminQueriesApi } from './provider-utils/awscloudformation';
export { DEPLOYMENT_MECHANISM } from './provider-utils/awscloudformation/base-api-stack';
export { convertDeperecatedRestApiPaths } from './provider-utils/awscloudformation/convert-deprecated-apigw-paths';
export { getContainers } from './provider-utils/awscloudformation/docker-compose';
export { EcsAlbStack } from './provider-utils/awscloudformation/ecs-alb-stack';
export { EcsStack } from './provider-utils/awscloudformation/ecs-apigw-stack';
export { promptToAddApiKey } from './provider-utils/awscloudformation/prompt-to-add-api-key';
export { ApiResource, generateContainersArtifacts, processDockerConfig, } from './provider-utils/awscloudformation/utils/containers-artifacts';
export { getAuthConfig } from './provider-utils/awscloudformation/utils/get-appsync-auth-config';
export { getResolverConfig } from './provider-utils/awscloudformation/utils/get-appsync-resolver-config';
export { getGitHubOwnerRepoFromPath } from './provider-utils/awscloudformation/utils/github';
export * from './graphql-transformer';
export * from './force-updates';
export { showApiAuthAcm } from './category-utils/show-auth-acm';
export { isDataStoreEnabled } from './category-utils/is-datastore-enabled';
export declare const console: (context: $TSContext) => Promise<void>;
export declare const migrate: (context: $TSContext, serviceName?: string) => Promise<void>;
export declare const initEnv: (context: $TSContext) => Promise<void>;
export declare const getPermissionPolicies: (context: $TSContext, resourceOpsMapping: Record<string, any>) => Promise<{
    permissionPolicies: any[];
    resourceAttributes: any[];
}>;
export declare const executeAmplifyCommand: (context: $TSContext) => Promise<void>;
export declare const executeAmplifyHeadlessCommand: (context: $TSContext, headlessPayload: string) => Promise<void>;
export declare const handleAmplifyEvent: (context: $TSContext, args: any) => Promise<void>;
export declare const addGraphQLAuthorizationMode: (context: $TSContext, args: Record<string, any>) => Promise<{
    authenticationType: string;
}>;
export declare const transformCategoryStack: (context: $TSContext, resource: Record<string, any>) => Promise<void>;
//# sourceMappingURL=index.d.ts.map