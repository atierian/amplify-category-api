"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelineWithAwaiter = void 0;
const path = __importStar(require("path"));
const codebuild = __importStar(require("aws-cdk-lib/aws-codebuild"));
const codepipeline = __importStar(require("aws-cdk-lib/aws-codepipeline"));
const codepipelineactions = __importStar(require("aws-cdk-lib/aws-codepipeline-actions"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const cdk = __importStar(require("aws-cdk-lib"));
const custom = __importStar(require("aws-cdk-lib/custom-resources"));
const constructs_1 = require("constructs");
const fs = __importStar(require("fs-extra"));
const github_1 = require("./utils/github");
const lambdaRuntimeNodeVersion = lambda.Runtime.NODEJS_18_X;
const lambdasDir = path.resolve(__dirname, '../../../resources/awscloudformation/lambdas');
class PipelineAwaiter extends constructs_1.Construct {
    constructor(scope, id, props) {
        const { pipeline, artifactBucketName, artifactKey, deploymentMechanism } = props;
        const { pipelineArn, pipelineName } = pipeline;
        const pipelineOnEventCodeFilePath = path.join(lambdasDir, 'pipeline-on-event.js');
        const onEventHandlerCode = fs.readFileSync(pipelineOnEventCodeFilePath, 'utf8');
        const onEventHandler = new lambda.Function(scope, `${id}CustomEventHandler`, {
            runtime: lambdaRuntimeNodeVersion,
            handler: 'index.handler',
            code: lambda.Code.fromInline(onEventHandlerCode),
            timeout: cdk.Duration.seconds(15),
        });
        const pipelineCodeFilePath = path.join(lambdasDir, 'pipeline.js');
        const isCompleteHandlerCode = fs.readFileSync(pipelineCodeFilePath, 'utf8');
        const isCompleteHandler = new lambda.Function(scope, `${id}CustomCompleteHandler`, {
            runtime: lambdaRuntimeNodeVersion,
            handler: 'index.handler',
            timeout: cdk.Duration.seconds(15),
            code: lambda.Code.fromInline(isCompleteHandlerCode),
        });
        isCompleteHandler.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['codepipeline:GetPipeline', 'codepipeline:ListPipelineExecutions'],
            resources: [pipelineArn],
        }));
        isCompleteHandler.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['cloudformation:DescribeStacks'],
            resources: [cdk.Stack.of(scope).stackId],
        }));
        const myProvider = new custom.Provider(scope, `${id}MyProvider`, {
            onEventHandler,
            isCompleteHandler,
            queryInterval: cdk.Duration.seconds(10),
        });
        new cdk.CustomResource(scope, `Deployment${id}`, {
            serviceToken: myProvider.serviceToken,
            properties: {
                artifactBucketName,
                artifactKey,
                pipelineName,
                deploymentMechanism,
            },
        });
        super(scope, id);
    }
}
class PipelineWithAwaiter extends constructs_1.Construct {
    constructor(scope, id, { skipWait = false, bucket, s3SourceActionKey, service, deploymentMechanism, gitHubSourceActionInfo, containersInfo, desiredCount, envName, }) {
        super(scope, id);
        const sourceOutput = new codepipeline.Artifact('SourceArtifact');
        const buildOutput = new codepipeline.Artifact('BuildArtifact');
        const codeBuildProject = new codebuild.PipelineProject(scope, `${id}CodeBuildProject`, {
            environment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_4_0,
                privileged: true,
            },
        });
        if (gitHubSourceActionInfo && gitHubSourceActionInfo.tokenSecretArn) {
            codeBuildProject.addToRolePolicy(new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    'secretsmanager:GetRandomPassword',
                    'secretsmanager:GetResourcePolicy',
                    'secretsmanager:GetSecretValue',
                    'secretsmanager:DescribeSecret',
                    'secretsmanager:ListSecretVersionIds',
                ],
                resources: [gitHubSourceActionInfo.tokenSecretArn],
            }));
        }
        codeBuildProject.role.addToPrincipalPolicy(new iam.PolicyStatement({
            resources: ['*'],
            actions: [
                'ecr:GetAuthorizationToken',
                'ecr:BatchGetImage',
                'ecr:GetDownloadUrlForLayer',
                'ecr:InitiateLayerUpload',
                'ecr:BatchCheckLayerAvailability',
                'ecr:UploadLayerPart',
                'ecr:CompleteLayerUpload',
                'ecr:PutImage',
            ],
            effect: iam.Effect.ALLOW,
        }));
        const prebuildStages = createPreBuildStages(scope, {
            bucket,
            s3SourceActionKey,
            gitHubSourceActionInfo,
            roleName: 'UpdateSource',
            sourceOutput,
        });
        const environmentVariables = containersInfo.reduce((acc, c) => {
            acc[`${c.container.containerName}_REPOSITORY_URI`] = {
                type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
                value: c.repository.repositoryUri,
            };
            return acc;
        }, {
            AWS_ACCOUNT_ID: {
                type: codebuild.BuildEnvironmentVariableType.PLAINTEXT,
                value: cdk.Aws.ACCOUNT_ID,
            },
        });
        const ecsDeployActionRole = new iam.Role(scope, 'EcsDeployActionRole', {
            assumedBy: new iam.AccountRootPrincipal(),
        });
        ecsDeployActionRole.addToPolicy(new iam.PolicyStatement({
            actions: ['ecs:TagResource'],
            effect: iam.Effect.ALLOW,
            resources: ['*'],
        }));
        const ecsDeployAction = new codepipelineactions.EcsDeployAction({
            actionName: 'Deploy',
            service: new (class extends constructs_1.Construct {
                constructor() {
                    super(...arguments);
                    this.cluster = {
                        clusterName: service.cluster,
                        env: {},
                    };
                    this.serviceArn = cdk.Fn.ref(service.attrServiceArn);
                    this.serviceName = service.serviceName;
                    this.stack = cdk.Stack.of(this);
                    this.env = {};
                    this.node = service.node;
                }
                applyRemovalPolicy(policy) {
                }
            })(this, 'tmpService'),
            input: buildOutput,
            role: ecsDeployActionRole,
        });
        const stagesWithDeploy = [].concat(prebuildStages, [
            {
                stageName: 'Build',
                actions: [
                    new codepipelineactions.CodeBuildAction({
                        actionName: 'Build',
                        type: codepipelineactions.CodeBuildActionType.BUILD,
                        project: codeBuildProject,
                        input: sourceOutput,
                        outputs: [buildOutput],
                        environmentVariables,
                    }),
                ],
            },
            {
                stageName: 'Predeploy',
                actions: [
                    new codepipelineactions.LambdaInvokeAction({
                        actionName: 'Predeploy',
                        lambda: (() => {
                            const preDeployCodeFilePath = path.join(lambdasDir, 'predeploy.js');
                            const lambdaHandlerCode = fs.readFileSync(preDeployCodeFilePath, 'utf8');
                            const action = new lambda.Function(scope, 'PreDeployLambda', {
                                code: lambda.Code.fromInline(lambdaHandlerCode),
                                handler: 'index.handler',
                                runtime: lambdaRuntimeNodeVersion,
                                environment: {
                                    DESIRED_COUNT: `${desiredCount}`,
                                    CLUSTER_NAME: service.cluster,
                                    SERVICE_NAME: service.serviceName,
                                },
                                timeout: cdk.Duration.seconds(15),
                            });
                            action.addToRolePolicy(new iam.PolicyStatement({
                                actions: ['ecs:UpdateService'],
                                effect: iam.Effect.ALLOW,
                                resources: [cdk.Fn.ref(service.logicalId)],
                            }));
                            return action;
                        })(),
                        inputs: [],
                        outputs: [],
                    }),
                ],
            },
            {
                stageName: 'Deploy',
                actions: [ecsDeployAction],
            },
        ]);
        this.pipelineName = `${envName}-${service.serviceName}`;
        const pipeline = new codepipeline.Pipeline(scope, `${id}Pipeline`, {
            pipelineName: this.pipelineName,
            crossAccountKeys: false,
            artifactBucket: bucket,
            stages: stagesWithDeploy,
        });
        pipeline.node.addDependency(service);
        if (!skipWait) {
            new PipelineAwaiter(scope, 'Awaiter', {
                pipeline,
                artifactBucketName: bucket.bucketName,
                artifactKey: s3SourceActionKey,
                deploymentMechanism,
            });
        }
        new cdk.CfnOutput(scope, 'PipelineName', { value: this.pipelineName });
    }
    getPipelineName() {
        return this.pipelineName;
    }
}
exports.PipelineWithAwaiter = PipelineWithAwaiter;
function createPreBuildStages(scope, { bucket, s3SourceActionKey, gitHubSourceActionInfo, sourceOutput, roleName, }) {
    const stages = [];
    const stage = {
        stageName: 'Source',
        actions: [],
    };
    stages.push(stage);
    if (gitHubSourceActionInfo && gitHubSourceActionInfo.path) {
        const { path, tokenSecretArn } = gitHubSourceActionInfo;
        const { owner, repo, branch } = (0, github_1.getGitHubOwnerRepoFromPath)(path);
        const preBuildOutput = new codepipeline.Artifact('PreBuildArtifact');
        stage.actions = [
            new codepipelineactions.GitHubSourceAction({
                actionName: 'Source',
                oauthToken: cdk.SecretValue.secretsManager(tokenSecretArn),
                owner,
                repo,
                branch,
                output: preBuildOutput,
            }),
        ];
        stages.push({
            stageName: 'PreBuild',
            actions: [
                new codepipelineactions.LambdaInvokeAction({
                    actionName: 'PreBuild',
                    lambda: new lambda.Function(scope, 'PreBuildLambda', {
                        code: lambda.S3Code.fromBucket(bucket, 'codepipeline-action-buildspec-generator-lambda.zip'),
                        handler: 'index.handler',
                        runtime: lambdaRuntimeNodeVersion,
                        timeout: cdk.Duration.seconds(15),
                    }),
                    inputs: [preBuildOutput],
                    outputs: [sourceOutput],
                }),
            ],
        });
    }
    else {
        stage.actions = [
            new codepipelineactions.S3SourceAction({
                actionName: 'Source',
                bucket,
                bucketKey: s3SourceActionKey,
                output: sourceOutput,
            }),
        ];
    }
    return stages;
}
//# sourceMappingURL=pipeline-with-awaiter.js.map