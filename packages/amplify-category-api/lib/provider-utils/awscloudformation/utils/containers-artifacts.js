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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processDockerConfig = exports.generateContainersArtifacts = exports.cfnFileName = void 0;
const path = __importStar(require("path"));
const rest_1 = require("@octokit/rest");
const fs = __importStar(require("fs-extra"));
const inquirer_1 = __importDefault(require("inquirer"));
const uuid_1 = require("uuid");
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const cdk = __importStar(require("aws-cdk-lib"));
const aws_constants_1 = require("../../../provider-utils/awscloudformation/aws-constants");
const docker_compose_1 = require("../../../provider-utils/awscloudformation/docker-compose");
const ecs_apigw_stack_1 = require("../ecs-apigw-stack");
const github_1 = require("../../../provider-utils/awscloudformation/utils/github");
const base_api_stack_1 = require("../base-api-stack");
const category_constants_1 = require("../../../category-constants");
const set_existing_secret_arns_1 = require("./containers/set-existing-secret-arns");
const cfnFileName = (resourceName) => `${resourceName}-cloudformation-template.json`;
exports.cfnFileName = cfnFileName;
async function generateContainersArtifacts(context, resource, askForExposedContainer = false) {
    const { providers: { [aws_constants_1.provider]: provider }, } = context.amplify.getProjectMeta();
    const { StackName: envName } = provider;
    const { category: categoryName, resourceName, gitHubInfo, deploymentMechanism, categoryPolicies = [], dependsOn, environmentMap, restrictAccess, apiType, } = resource;
    const backendDir = context.amplify.pathManager.getBackendDirPath();
    const resourceDir = path.normalize(path.join(backendDir, categoryName, resourceName));
    const srcPath = path.join(resourceDir, 'src');
    const { containersPorts, containers, isInitialDeploy, desiredCount, exposedContainer, secretsArns } = await processDockerConfig(context, resource, srcPath, askForExposedContainer);
    const repositories = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'describeEcrRepositories');
    const existingEcrRepositories = new Set(repositories
        .map(({ repositoryName }) => repositoryName)
        .filter((repositoryName) => repositoryName.startsWith(`${envName}-${categoryName}-${resourceName}-`)));
    const stack = new ecs_apigw_stack_1.EcsStack(undefined, 'ContainersStack', {
        categoryName,
        apiName: resourceName,
        taskPorts: containersPorts,
        dependsOn,
        policies: categoryPolicies,
        taskEnvironmentVariables: environmentMap,
        gitHubSourceActionInfo: gitHubInfo,
        deploymentMechanism,
        containers,
        isInitialDeploy,
        desiredCount,
        restrictAccess,
        currentStackName: envName,
        apiType,
        exposedContainer,
        secretsArns,
        existingEcrRepositories,
    });
    const cfn = stack.toCloudFormation();
    amplify_cli_core_1.JSONUtilities.writeJson(path.normalize(path.join(resourceDir, (0, exports.cfnFileName)(resourceName))), cfn);
    return {
        exposedContainer,
        pipelineInfo: { consoleUrl: stack.getPipelineConsoleUrl(provider.Region) },
    };
}
exports.generateContainersArtifacts = generateContainersArtifacts;
async function processDockerConfig(context, resource, srcPath, askForExposedContainer = false) {
    var _a, _b;
    const { providers: { [aws_constants_1.provider]: provider }, } = context.amplify.getProjectMeta();
    const { StackName: envName } = provider;
    const { resourceName, gitHubInfo, deploymentMechanism, output, exposedContainer: exposedContainerFromMeta } = resource;
    const dockerComposeFileNameYaml = 'docker-compose.yaml';
    const dockerComposeFileNameYml = 'docker-compose.yml';
    const dockerfileFileName = 'Dockerfile';
    const containerDefinitionFileNames = [dockerComposeFileNameYaml, dockerComposeFileNameYml, dockerfileFileName];
    const containerDefinitionFiles = {};
    for await (const fileName of containerDefinitionFileNames) {
        switch (deploymentMechanism) {
            case base_api_stack_1.DEPLOYMENT_MECHANISM.FULLY_MANAGED:
            case base_api_stack_1.DEPLOYMENT_MECHANISM.SELF_MANAGED: {
                const filePath = path.normalize(path.join(srcPath, fileName));
                if (fs.existsSync(filePath)) {
                    containerDefinitionFiles[fileName] = fs.readFileSync(filePath).toString();
                }
                break;
            }
            case base_api_stack_1.DEPLOYMENT_MECHANISM.INDENPENDENTLY_MANAGED: {
                const { path: repoUri, tokenSecretArn } = gitHubInfo;
                const { SecretString: gitHubToken } = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'retrieveSecret', {
                    secretArn: tokenSecretArn,
                });
                const octokit = new rest_1.Octokit({ auth: gitHubToken });
                const { owner, repo, branch, path: pathInRepo } = (0, github_1.getGitHubOwnerRepoFromPath)(repoUri);
                try {
                    const { data: { content, encoding }, } = (await octokit.repos.getContent({
                        owner,
                        repo,
                        ...(branch ? { ref: branch } : undefined),
                        path: path.join(pathInRepo, fileName),
                    }));
                    containerDefinitionFiles[fileName] = Buffer.from(content, encoding).toString('utf8');
                }
                catch (error) {
                    const { status } = error;
                    if (status !== 404) {
                        throw error;
                    }
                }
                break;
            }
            default: {
                const exhaustiveCheck = deploymentMechanism;
                throw new Error(`Unhandled type [${exhaustiveCheck}]`);
            }
        }
    }
    if (Object.keys(containerDefinitionFiles).length === 0) {
        throw new Error('No definition available (docker-compose.yaml / docker-compose.yml / Dockerfile)');
    }
    if (containerDefinitionFiles[dockerComposeFileNameYaml] && containerDefinitionFiles[dockerComposeFileNameYml]) {
        throw new Error('There should be only one docker-compose.yaml / docker-compose.yml)');
    }
    const composeContents = containerDefinitionFiles[dockerComposeFileNameYaml] || containerDefinitionFiles[dockerComposeFileNameYml];
    const { [dockerfileFileName]: dockerfileContents } = containerDefinitionFiles;
    const { buildspec, containers, service, secrets } = (0, docker_compose_1.getContainers)(composeContents, dockerfileContents);
    const containersPorts = containers.reduce((acc, container) => acc.concat(container.portMappings.map(({ containerPort }) => containerPort)), []);
    const newContainersName = Array.from(new Set(containers.map(({ name }) => name)));
    let isInitialDeploy = Object.keys(output !== null && output !== void 0 ? output : {}).length === 0;
    const currentContainersSet = new Set((_a = output === null || output === void 0 ? void 0 : output.ContainerNames) === null || _a === void 0 ? void 0 : _a.split(','));
    isInitialDeploy = isInitialDeploy || newContainersName.some((newContainer) => !currentContainersSet.has(newContainer));
    let exposedContainer;
    const containersExposed = containers.filter((container) => container.portMappings.length > 0);
    if (containersPorts.length === 0) {
        throw new Error('Service requires at least one exposed port');
    }
    else if (containersPorts.length > 1) {
        exposedContainer = await checkContainerExposed(containersExposed, exposedContainerFromMeta, askForExposedContainer);
    }
    else {
        exposedContainer = {
            name: containersExposed[0].name,
            port: containersExposed[0].portMappings[0].containerPort,
        };
    }
    fs.ensureDirSync(srcPath);
    fs.writeFileSync(path.join(srcPath, 'buildspec.yml'), buildspec);
    const secretsArns = new Map();
    if ((await shouldUpdateSecrets(context, secrets)) || isInitialDeploy) {
        const errors = Object.entries(secrets).reduce((acc, [secretName, secretFilePath]) => {
            const baseDir = path.isAbsolute(secretFilePath) ? '' : srcPath;
            const normalizedFilePath = path.normalize(path.join(baseDir, secretFilePath));
            secrets[secretName] = normalizedFilePath;
            let canRead = true;
            try {
                const fd = fs.openSync(normalizedFilePath, 'r');
                fs.closeSync(fd);
            }
            catch (err) {
                canRead = false;
            }
            if (!canRead) {
                acc.push(`Secret file "${secretFilePath}" can't be read.`);
                return acc;
            }
            const basename = path.basename(normalizedFilePath);
            const hasCorrectPrefix = basename.startsWith('.secret-');
            if (!hasCorrectPrefix) {
                acc.push(`Secret file "${secretFilePath}" doesn't start with the ".secret-" prefix.`);
                return acc;
            }
            const isInsideSrc = normalizedFilePath.startsWith(path.join(srcPath, path.sep));
            if (isInsideSrc) {
                acc.push(`Secret file "${secretFilePath}" should not be inside the "src" folder. The "src" folder will be uploaded to S3.`);
                return acc;
            }
            return acc;
        }, []);
        if (errors.length > 0) {
            throw new Error(['Error(s) in secret file(s):'].concat(errors).join('\n'));
        }
        for await (const entries of Object.entries(secrets)) {
            const [secretName, secretFilePath] = entries;
            const contents = fs.readFileSync(secretFilePath).toString();
            const ssmSecretName = `${envName}-${resourceName}-${secretName}`;
            const { ARN: secretArn } = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'upsertSecretValue', {
                secret: contents,
                description: `Secret for ${resourceName}`,
                name: ssmSecretName,
                version: (0, uuid_1.v4)(),
            });
            const [prefix] = secretArn.toString().split(ssmSecretName);
            const secretArnRef = cdk.Fn.join('', [prefix, cdk.Fn.ref('rootStackName'), '-', resourceName, '-', secretName]);
            secretsArns.set(secretName, secretArnRef);
        }
    }
    else {
        const { cfnTemplate } = (0, amplify_cli_core_1.readCFNTemplate)(path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), category_constants_1.category, resourceName, (0, exports.cfnFileName)(resourceName)));
        (0, set_existing_secret_arns_1.setExistingSecretArns)(secretsArns, cfnTemplate);
    }
    const desiredCount = (_b = service === null || service === void 0 ? void 0 : service.replicas) !== null && _b !== void 0 ? _b : 1;
    return {
        containersPorts,
        containers,
        isInitialDeploy,
        desiredCount,
        exposedContainer,
        secretsArns,
    };
}
exports.processDockerConfig = processDockerConfig;
async function shouldUpdateSecrets(context, secrets) {
    const hasSecrets = Object.keys(secrets).length > 0;
    if (!hasSecrets || context.exeInfo.inputParams.yes) {
        return false;
    }
    const { update_secrets } = await inquirer_1.default.prompt({
        name: 'update_secrets',
        type: 'confirm',
        message: 'Secret configuration detected. Do you wish to store new values in the cloud?',
        default: false,
    });
    return update_secrets;
}
async function checkContainerExposed(containersExposed, exposedContainerFromMeta = { name: '', port: 0 }, askForExposedContainer = false) {
    const containerExposed = containersExposed.find((container) => container.name === exposedContainerFromMeta.name);
    if (!askForExposedContainer && (containerExposed === null || containerExposed === void 0 ? void 0 : containerExposed.portMappings.find((port) => port.containerPort === exposedContainerFromMeta.port))) {
        return { ...exposedContainerFromMeta };
    }
    else {
        const choices = containersExposed.map((container) => ({
            name: container.name,
            value: container,
        }));
        const { containerToExpose } = await inquirer_1.default.prompt({
            message: 'Select which container is the entrypoint',
            name: 'containerToExpose',
            type: 'list',
            choices,
        });
        return {
            name: containerToExpose.name,
            port: containerToExpose.portMappings[0].containerPort,
        };
    }
}
//# sourceMappingURL=containers-artifacts.js.map