import { $TSContext } from '@aws-amplify/amplify-cli-core';
import Container from '../docker-compose/ecs-objects/container';
import { API_TYPE, ResourceDependency } from '../../../provider-utils/awscloudformation/service-walkthroughs/containers-walkthrough';
import { DEPLOYMENT_MECHANISM } from '../base-api-stack';
export declare const cfnFileName: (resourceName: string) => string;
export type ApiResource = {
    category: string;
    resourceName: string;
    gitHubInfo?: {
        path: string;
        tokenSecretArn: string;
    };
    deploymentMechanism: DEPLOYMENT_MECHANISM;
    authName: string;
    restrictAccess: boolean;
    dependsOn: ResourceDependency[];
    environmentMap: Record<string, string>;
    categoryPolicies: any[];
    mutableParametersState: any;
    output?: Record<string, any>;
    apiType?: API_TYPE;
    exposedContainer?: {
        name: string;
        port: number;
    };
};
type ExposedContainer = {
    name: string;
    port: number;
};
type ContainerArtifactsMetadata = {
    exposedContainer: ExposedContainer;
    pipelineInfo: {
        consoleUrl: string;
    };
};
export declare function generateContainersArtifacts(context: $TSContext, resource: ApiResource, askForExposedContainer?: boolean): Promise<ContainerArtifactsMetadata>;
export declare function processDockerConfig(context: $TSContext, resource: ApiResource, srcPath: string, askForExposedContainer?: boolean): Promise<{
    containersPorts: number[];
    containers: Container[];
    isInitialDeploy: boolean;
    desiredCount: number;
    exposedContainer: {
        name: string;
        port: number;
    };
    secretsArns: Map<string, string>;
}>;
export {};
//# sourceMappingURL=containers-artifacts.d.ts.map