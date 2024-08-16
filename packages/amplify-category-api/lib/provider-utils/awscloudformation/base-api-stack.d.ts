import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudmap from 'aws-cdk-lib/aws-servicediscovery';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import Container from './docker-compose/ecs-objects/container';
import { GitHubSourceActionInfo } from './pipeline-with-awaiter';
export declare enum DEPLOYMENT_MECHANISM {
    FULLY_MANAGED = "FULLY_MANAGED",
    INDENPENDENTLY_MANAGED = "INDENPENDENTLY_MANAGED",
    SELF_MANAGED = "SELF_MANAGED"
}
export type ContainersStackProps = Readonly<{
    skipWait?: boolean;
    categoryName: string;
    apiName: string;
    dependsOn: ReadonlyArray<{
        category: string;
        resourceName: string;
        attributes: string[];
    }>;
    taskEnvironmentVariables?: Record<string, any>;
    deploymentMechanism: DEPLOYMENT_MECHANISM;
    restrictAccess: boolean;
    policies?: ReadonlyArray<iam.PolicyStatement | Record<string, any>>;
    containers: ReadonlyArray<Container>;
    secretsArns?: ReadonlyMap<string, string>;
    exposedContainer: {
        name: string;
        port: number;
    };
    taskPorts: number[];
    isInitialDeploy: boolean;
    desiredCount: number;
    createCloudMapService?: boolean;
    gitHubSourceActionInfo?: GitHubSourceActionInfo;
    existingEcrRepositories: Set<string>;
    currentStackName: string;
}>;
export declare abstract class ContainersStack extends cdk.Stack {
    private readonly props;
    protected readonly vpcId: string;
    private readonly vpcCidrBlock;
    protected readonly subnets: ReadonlyArray<string>;
    private readonly clusterName;
    private readonly zipPath;
    private readonly cloudMapNamespaceId;
    protected readonly vpcLinkId: string;
    private readonly pipelineWithAwaiter;
    protected readonly cloudMapService: cloudmap.CfnService | undefined;
    protected readonly ecsService: ecs.CfnService;
    protected readonly isAuthCondition: cdk.CfnCondition;
    protected readonly appClientId: string | undefined;
    protected readonly userPoolId: string | undefined;
    protected readonly ecsServiceSecurityGroup: ec2.CfnSecurityGroup;
    protected readonly parameters: ReadonlyMap<string, cdk.CfnParameter>;
    protected readonly envName: string;
    protected readonly deploymentBucketName: string;
    protected readonly awaiterS3Key: string;
    constructor(scope: Construct, id: string, props: ContainersStackProps);
    private init;
    private ecs;
    private pipeline;
    protected getPipelineName(): string;
    getPipelineConsoleUrl(region: string): string;
    private renderCfnTemplate;
    toCloudFormation(): any;
}
//# sourceMappingURL=base-api-stack.d.ts.map