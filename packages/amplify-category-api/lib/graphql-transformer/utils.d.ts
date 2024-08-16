import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { DeploymentResources } from './cdk-compat/deployment-resources';
import { TransformerProjectConfig } from './cdk-compat/project-config';
export declare const getIdentityPoolId: (ctx: $TSContext) => Promise<string | undefined>;
export declare const getAdminRoles: (ctx: $TSContext, apiResourceName: string | undefined) => Promise<Array<string>>;
export declare function mergeUserConfigWithTransformOutput(userConfig: TransformerProjectConfig, transformOutput: DeploymentResources, opts?: any): DeploymentResources;
export declare function writeDeploymentToDisk(context: $TSContext, deployment: DeploymentResources, directory: string, rootStackFileName: string, buildParameters: Object): Promise<void>;
//# sourceMappingURL=utils.d.ts.map