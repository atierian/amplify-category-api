import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { DEPLOYMENT_MECHANISM } from '../base-api-stack';
import { GitHubSourceActionInfo } from '../pipeline-with-awaiter';
export interface ResourceDependency {
    category: string;
    resourceName: string;
    attributes: string[];
    attributeEnvMap?: {
        [name: string]: string;
    };
}
export declare enum API_TYPE {
    GRAPHQL = "GRAPHQL",
    REST = "REST"
}
export type ServiceConfiguration = {
    resourceName: string;
    imageSource: {
        type: IMAGE_SOURCE_TYPE;
        template?: string;
    };
    gitHubPath: string;
    authName: string;
    gitHubToken: string;
    deploymentMechanism: DEPLOYMENT_MECHANISM;
    restrictAccess: boolean;
    dependsOn?: ResourceDependency[];
    categoryPolicies?: any[];
    mutableParametersState?: any;
    environmentMap?: Record<string, any>;
    gitHubInfo?: GitHubSourceActionInfo;
};
export declare function serviceWalkthrough(context: $TSContext, apiType: API_TYPE): Promise<Partial<ServiceConfiguration>>;
export declare enum IMAGE_SOURCE_TYPE {
    TEMPLATE = "TEMPLATE",
    CUSTOM = "CUSTOM"
}
export declare function updateWalkthrough(context: $TSContext, apiType: API_TYPE): Promise<any>;
export declare function getPermissionPolicies(context: any, service: any, resourceName: any, crudOptions: any): Promise<void>;
//# sourceMappingURL=containers-walkthrough.d.ts.map