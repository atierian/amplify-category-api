import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { DEPLOYMENT_MECHANISM } from './base-api-stack';
export type GitHubSourceActionInfo = {
    path: string;
    tokenSecretArn: string;
};
export declare class PipelineWithAwaiter extends Construct {
    pipelineName: string;
    constructor(scope: Construct, id: string, { skipWait, bucket, s3SourceActionKey, service, deploymentMechanism, gitHubSourceActionInfo, containersInfo, desiredCount, envName, }: {
        skipWait?: boolean;
        bucket: s3.IBucket;
        s3SourceActionKey?: string;
        deploymentMechanism: DEPLOYMENT_MECHANISM;
        gitHubSourceActionInfo?: GitHubSourceActionInfo;
        service: ecs.CfnService;
        containersInfo: {
            container: ecs.ContainerDefinition;
            repository: ecr.IRepository;
        }[];
        desiredCount: number;
        envName: string;
    });
    getPipelineName(): string;
}
export type ContainerStackProps = {
    deploymentBucket: string;
    containerPort: number;
    awaiterZipPath: string;
    gitHubPath?: string;
    gitHubTokenSecretsManagerArn: string;
};
//# sourceMappingURL=pipeline-with-awaiter.d.ts.map