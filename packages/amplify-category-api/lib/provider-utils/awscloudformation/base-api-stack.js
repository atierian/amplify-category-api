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
exports.ContainersStack = exports.DEPLOYMENT_MECHANISM = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const ecr = __importStar(require("aws-cdk-lib/aws-ecr"));
const ecs = __importStar(require("aws-cdk-lib/aws-ecs"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const aws_lambda_1 = require("aws-cdk-lib/aws-lambda");
const logs = __importStar(require("aws-cdk-lib/aws-logs"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const ssm = __importStar(require("aws-cdk-lib/aws-secretsmanager"));
const cloudmap = __importStar(require("aws-cdk-lib/aws-servicediscovery"));
const cdk = __importStar(require("aws-cdk-lib"));
const category_constants_1 = require("../../category-constants");
const pipeline_with_awaiter_1 = require("./pipeline-with-awaiter");
const PIPELINE_AWAITER_ZIP = 'custom-resource-pipeline-awaiter-18.zip';
var DEPLOYMENT_MECHANISM;
(function (DEPLOYMENT_MECHANISM) {
    DEPLOYMENT_MECHANISM["FULLY_MANAGED"] = "FULLY_MANAGED";
    DEPLOYMENT_MECHANISM["INDENPENDENTLY_MANAGED"] = "INDENPENDENTLY_MANAGED";
    DEPLOYMENT_MECHANISM["SELF_MANAGED"] = "SELF_MANAGED";
})(DEPLOYMENT_MECHANISM = exports.DEPLOYMENT_MECHANISM || (exports.DEPLOYMENT_MECHANISM = {}));
class ContainersStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, { synthesizer: new cdk.LegacyStackSynthesizer() });
        this.props = props;
        const { parameters, vpcId, vpcCidrBlock, subnets, clusterName, zipPath, cloudMapNamespaceId, vpcLinkId, isAuthCondition, appClientId, userPoolId, envName, deploymentBucketName, awaiterS3Key, } = this.init();
        this.parameters = parameters;
        this.vpcId = vpcId;
        this.vpcCidrBlock = vpcCidrBlock;
        this.subnets = subnets;
        this.clusterName = clusterName;
        this.zipPath = zipPath;
        this.cloudMapNamespaceId = cloudMapNamespaceId;
        this.vpcLinkId = vpcLinkId;
        this.isAuthCondition = isAuthCondition;
        this.appClientId = appClientId;
        this.userPoolId = userPoolId;
        this.envName = envName;
        this.deploymentBucketName = deploymentBucketName;
        this.awaiterS3Key = awaiterS3Key;
        const { service, serviceSecurityGroup, containersInfo, cloudMapService } = this.ecs();
        this.cloudMapService = cloudMapService;
        this.ecsService = service;
        this.ecsServiceSecurityGroup = serviceSecurityGroup;
        const { gitHubSourceActionInfo, skipWait } = this.props;
        const { pipelineWithAwaiter } = this.pipeline({
            skipWait,
            service,
            containersInfo: containersInfo.filter((container) => container.repository),
            gitHubSourceActionInfo,
        });
        this.pipelineWithAwaiter = pipelineWithAwaiter;
        new cdk.CfnOutput(this, 'ContainerNames', {
            value: cdk.Fn.join(',', containersInfo.map(({ container: { containerName } }) => containerName)),
        });
    }
    init() {
        const { restrictAccess, dependsOn, deploymentMechanism } = this.props;
        new cdk.CfnParameter(this, 'env', { type: 'String' });
        const paramDomain = new cdk.CfnParameter(this, 'domain', { type: 'String', default: '' });
        const paramRestrictAccess = new cdk.CfnParameter(this, 'restrictAccess', {
            type: 'String',
            allowedValues: ['true', 'false'],
            default: 'false',
        });
        const paramZipPath = new cdk.CfnParameter(this, 'ParamZipPath', {
            type: 'String',
            default: deploymentMechanism === DEPLOYMENT_MECHANISM.FULLY_MANAGED ? undefined : '',
        });
        const parameters = new Map();
        parameters.set('ParamZipPath', paramZipPath);
        parameters.set('domain', paramDomain);
        parameters.set('restrictAccess', paramRestrictAccess);
        const authParams = {};
        const paramTypes = {
            NetworkStackSubnetIds: 'CommaDelimitedList',
        };
        dependsOn.forEach(({ category, resourceName, attributes }) => {
            attributes.forEach((attrib) => {
                var _a;
                const paramName = [category, resourceName, attrib].join('');
                const type = (_a = paramTypes[paramName]) !== null && _a !== void 0 ? _a : 'String';
                const param = new cdk.CfnParameter(this, paramName, { type });
                parameters.set(paramName, param);
                if (category === 'auth') {
                    authParams[attrib] = param;
                }
            });
        });
        const paramVpcId = parameters.get(`${category_constants_1.NETWORK_STACK_LOGICAL_ID}VpcId`);
        const paramVpcCidrBlock = parameters.get(`${category_constants_1.NETWORK_STACK_LOGICAL_ID}VpcCidrBlock`);
        const paramSubnetIds = parameters.get(`${category_constants_1.NETWORK_STACK_LOGICAL_ID}SubnetIds`);
        const paramClusterName = parameters.get(`${category_constants_1.NETWORK_STACK_LOGICAL_ID}ClusterName`);
        const paramCloudMapNamespaceId = parameters.get(`${category_constants_1.NETWORK_STACK_LOGICAL_ID}CloudMapNamespaceId`);
        const paramVpcLinkId = parameters.get(`${category_constants_1.NETWORK_STACK_LOGICAL_ID}VpcLinkId`);
        const { UserPoolId: paramUserPoolId, AppClientIDWeb: paramAppClientIdWeb } = authParams;
        const isAuthCondition = new cdk.CfnCondition(this, 'isAuthCondition', {
            expression: cdk.Fn.conditionAnd(cdk.Fn.conditionEquals(restrictAccess, true), cdk.Fn.conditionNot(cdk.Fn.conditionEquals(paramUserPoolId !== null && paramUserPoolId !== void 0 ? paramUserPoolId : '', '')), cdk.Fn.conditionNot(cdk.Fn.conditionEquals(paramAppClientIdWeb !== null && paramAppClientIdWeb !== void 0 ? paramAppClientIdWeb : '', ''))),
        });
        const stackNameParameter = new cdk.CfnParameter(this, 'rootStackName', {
            type: 'String',
        });
        const deploymentBucketName = new cdk.CfnParameter(this, 'deploymentBucketName', {
            type: 'String',
        });
        const awaiterS3Key = new cdk.CfnParameter(this, 'awaiterS3Key', {
            type: 'String',
            default: PIPELINE_AWAITER_ZIP,
        });
        return {
            parameters,
            vpcId: paramVpcId.valueAsString,
            vpcCidrBlock: paramVpcCidrBlock.valueAsString,
            subnets: paramSubnetIds.valueAsList,
            clusterName: paramClusterName.valueAsString,
            zipPath: paramZipPath.valueAsString,
            cloudMapNamespaceId: paramCloudMapNamespaceId.valueAsString,
            vpcLinkId: paramVpcLinkId.valueAsString,
            isAuthCondition,
            userPoolId: paramUserPoolId && paramUserPoolId.valueAsString,
            appClientId: paramAppClientIdWeb && paramAppClientIdWeb.valueAsString,
            envName: stackNameParameter.valueAsString,
            deploymentBucketName: deploymentBucketName.valueAsString,
            awaiterS3Key: awaiterS3Key.valueAsString,
        };
    }
    ecs() {
        const { categoryName, apiName, policies, containers, secretsArns, taskEnvironmentVariables, exposedContainer, taskPorts, isInitialDeploy, desiredCount, currentStackName, createCloudMapService, } = this.props;
        let cloudMapService = undefined;
        if (createCloudMapService) {
            cloudMapService = new cloudmap.CfnService(this, 'CloudmapService', {
                name: apiName,
                dnsConfig: {
                    dnsRecords: [
                        {
                            ttl: 60,
                            type: cloudmap.DnsRecordType.SRV,
                        },
                    ],
                    namespaceId: this.cloudMapNamespaceId,
                    routingPolicy: cloudmap.RoutingPolicy.MULTIVALUE,
                },
            });
        }
        const task = new ecs.TaskDefinition(this, 'TaskDefinition', {
            compatibility: ecs.Compatibility.FARGATE,
            memoryMiB: '1024',
            cpu: '512',
            family: `${this.envName}-${apiName}`,
        });
        task.node.defaultChild.overrideLogicalId('TaskDefinition');
        policies.forEach((policy) => {
            const statement = isPolicyStatement(policy) ? policy : jsonPolicyToCdkPolicyStatement(policy);
            task.addToTaskRolePolicy(statement);
        });
        const containersInfo = [];
        containers.forEach(({ name, image, build, portMappings, logConfiguration, environment, entrypoint: entryPoint, command, working_dir: workingDirectory, healthcheck: healthCheck, secrets: containerSecrets, }) => {
            var _a, _b, _c;
            const logGroup = new logs.LogGroup(this, `${name}ContainerLogGroup`, {
                logGroupName: `/ecs/${this.envName}-${apiName}-${name}`,
                retention: logs.RetentionDays.ONE_MONTH,
                removalPolicy: cdk.RemovalPolicy.DESTROY,
            });
            const { logDriver, options: { 'awslogs-stream-prefix': streamPrefix } = {} } = logConfiguration;
            const logging = logDriver === 'awslogs'
                ? ecs.LogDriver.awsLogs({
                    streamPrefix,
                    logGroup: logs.LogGroup.fromLogGroupName(this, `${name}logGroup`, logGroup.logGroupName),
                })
                : undefined;
            let repository;
            if (build) {
                const logicalId = `${name}Repository`;
                const repositoryName = `${currentStackName}-${categoryName}-${apiName}-${name}`;
                if (this.props.existingEcrRepositories.has(repositoryName)) {
                    repository = ecr.Repository.fromRepositoryName(this, logicalId, repositoryName);
                }
                else {
                    repository = new ecr.Repository(this, logicalId, {
                        repositoryName: `${this.envName}-${categoryName}-${apiName}-${name}`,
                        removalPolicy: cdk.RemovalPolicy.RETAIN,
                        lifecycleRules: [
                            {
                                rulePriority: 10,
                                maxImageCount: 1,
                                tagPrefixList: ['latest'],
                                tagStatus: ecr.TagStatus.TAGGED,
                            },
                            {
                                rulePriority: 100,
                                maxImageAge: cdk.Duration.days(7),
                                tagStatus: ecr.TagStatus.ANY,
                            },
                        ],
                    });
                    repository.node.defaultChild.overrideLogicalId(logicalId);
                }
                repository.grantPull(task.obtainExecutionRole());
            }
            const secrets = {};
            const environmentWithoutSecrets = environment || {};
            containerSecrets.forEach((s, i) => {
                if (secretsArns.has(s)) {
                    secrets[s] = ecs.Secret.fromSecretsManager(ssm.Secret.fromSecretPartialArn(this, `${name}secret${i + 1}`, secretsArns.get(s)));
                }
                delete environmentWithoutSecrets[s];
            });
            const container = task.addContainer(name, {
                image: repository ? ecs.ContainerImage.fromEcrRepository(repository) : ecs.ContainerImage.fromRegistry(image),
                logging,
                environment: {
                    ...taskEnvironmentVariables,
                    ...environmentWithoutSecrets,
                },
                entryPoint,
                command,
                workingDirectory,
                healthCheck: healthCheck && {
                    command: healthCheck.command,
                    interval: cdk.Duration.seconds((_a = healthCheck.interval) !== null && _a !== void 0 ? _a : 30),
                    retries: healthCheck.retries,
                    timeout: cdk.Duration.seconds((_b = healthCheck.timeout) !== null && _b !== void 0 ? _b : 5),
                    startPeriod: cdk.Duration.seconds((_c = healthCheck.start_period) !== null && _c !== void 0 ? _c : 0),
                },
                secrets,
            });
            containersInfo.push({
                container,
                repository,
            });
            portMappings === null || portMappings === void 0 ? void 0 : portMappings.forEach(({ containerPort, protocol, hostPort }) => {
                container.addPortMappings({
                    containerPort,
                    protocol: ecs.Protocol.TCP,
                });
            });
        });
        const serviceSecurityGroup = new ec2.CfnSecurityGroup(this, 'ServiceSG', {
            vpcId: this.vpcId,
            groupDescription: 'Service SecurityGroup',
            securityGroupEgress: [
                {
                    description: 'Allow all outbound traffic by default',
                    cidrIp: '0.0.0.0/0',
                    ipProtocol: '-1',
                },
            ],
            securityGroupIngress: taskPorts.map((servicePort) => ({
                ipProtocol: 'tcp',
                fromPort: servicePort,
                toPort: servicePort,
                cidrIp: this.vpcCidrBlock,
            })),
        });
        let serviceRegistries = undefined;
        if (cloudMapService) {
            serviceRegistries = [
                {
                    containerName: exposedContainer.name,
                    containerPort: exposedContainer.port,
                    registryArn: cloudMapService.attrArn,
                },
            ];
        }
        const service = new ecs.CfnService(this, 'Service', {
            serviceName: `${apiName}-service-${exposedContainer.name}-${exposedContainer.port}`,
            cluster: this.clusterName,
            launchType: 'FARGATE',
            desiredCount: isInitialDeploy ? 0 : desiredCount,
            networkConfiguration: {
                awsvpcConfiguration: {
                    assignPublicIp: 'ENABLED',
                    securityGroups: [serviceSecurityGroup.attrGroupId],
                    subnets: this.subnets,
                },
            },
            taskDefinition: task.taskDefinitionArn,
            serviceRegistries,
        });
        new cdk.CfnOutput(this, 'ServiceName', {
            value: service.serviceName,
        });
        new cdk.CfnOutput(this, 'ClusterName', {
            value: this.clusterName,
        });
        return {
            service,
            serviceSecurityGroup,
            containersInfo,
            cloudMapService,
        };
    }
    pipeline({ skipWait = false, service, containersInfo, gitHubSourceActionInfo, }) {
        const { deploymentMechanism, desiredCount } = this.props;
        const s3SourceActionKey = this.zipPath;
        const bucket = s3.Bucket.fromBucketName(this, 'Bucket', this.deploymentBucketName);
        const pipelineWithAwaiter = new pipeline_with_awaiter_1.PipelineWithAwaiter(this, 'ApiPipeline', {
            skipWait,
            envName: this.envName,
            containersInfo,
            service,
            bucket,
            s3SourceActionKey,
            deploymentMechanism,
            gitHubSourceActionInfo,
            desiredCount,
        });
        pipelineWithAwaiter.node.addDependency(service);
        return { pipelineWithAwaiter };
    }
    getPipelineName() {
        return this.pipelineWithAwaiter.getPipelineName();
    }
    getPipelineConsoleUrl(region) {
        const pipelineName = this.getPipelineName();
        return `https://${region}.console.aws.amazon.com/codesuite/codepipeline/pipelines/${pipelineName}/view`;
    }
    renderCfnTemplate() {
        const root = this.node.root;
        const assembly = root.synth();
        if (this.nestedStackParent) {
            return JSON.parse(fs.readFileSync(path.join(assembly.directory, this.templateFile)).toString('utf-8'));
        }
        return assembly.getStackArtifact(this.artifactId).template;
    }
    toCloudFormation() {
        this.node
            .findAll()
            .filter((construct) => construct instanceof aws_lambda_1.CfnFunction)
            .map((construct) => construct)
            .forEach((lambdaFunction) => {
            if (lambdaFunction.logicalId.includes('AwaiterMyProvider')) {
                lambdaFunction.code = {
                    s3Bucket: this.deploymentBucketName,
                    s3Key: this.awaiterS3Key,
                };
            }
        });
        const cfn = this.renderCfnTemplate();
        Object.keys(cfn.Parameters).forEach((k) => {
            if (k.startsWith('AssetParameters')) {
                delete cfn.Parameters[k];
            }
        });
        return cfn;
    }
}
exports.ContainersStack = ContainersStack;
function jsonPolicyToCdkPolicyStatement(policy) {
    return new iam.PolicyStatement({
        effect: policy.Effect,
        actions: Array.isArray(policy.Action) ? policy.Action : [policy.Action],
        resources: Array.isArray(policy.Resource) ? policy.Resource.map((r) => cdk.Token.asString(r)) : [cdk.Token.asString(policy.Resource)],
    });
}
function isPolicyStatement(obj) {
    if (obj && typeof obj.toStatementJson === 'function') {
        return true;
    }
    return false;
}
//# sourceMappingURL=base-api-stack.js.map