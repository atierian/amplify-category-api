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
exports.updateResource = exports.addResource = void 0;
const path = __importStar(require("path"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const fs = __importStar(require("fs-extra"));
const uuid_1 = require("uuid");
const category_constants_1 = require("../../category-constants");
const base_api_stack_1 = require("./base-api-stack");
const containers_walkthrough_1 = require("./service-walkthroughs/containers-walkthrough");
const containers_artifacts_1 = require("./utils/containers-artifacts");
const addResource = async (serviceWalkthroughPromise, context, category, service, options, apiType) => {
    const walkthroughOptions = await serviceWalkthroughPromise;
    const { resourceName, restrictAccess, imageSource, gitHubPath, gitHubToken, deploymentMechanism, categoryPolicies, environmentMap, dependsOn = [], mutableParametersState, } = walkthroughOptions;
    const resourceDirPath = amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, category, resourceName);
    let [authName, updatedDependsOn] = await getResourceDependencies({ dependsOn, restrictAccess, category, resourceName, context });
    let gitHubInfo;
    if (deploymentMechanism === base_api_stack_1.DEPLOYMENT_MECHANISM.INDENPENDENTLY_MANAGED) {
        const { StackName } = context.amplify.getProjectDetails().amplifyMeta.providers['awscloudformation'];
        const secretName = `${StackName}-${category}-${resourceName}-github-token`;
        const { ARN: secretArn } = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'newSecret', {
            secret: gitHubToken,
            description: 'GitHub OAuth token',
            name: secretName,
            version: secretName,
        });
        const gitHubTokenSecretArn = secretArn;
        gitHubInfo = {
            path: gitHubPath,
            tokenSecretArn: gitHubTokenSecretArn,
        };
    }
    const build = deploymentMechanism === base_api_stack_1.DEPLOYMENT_MECHANISM.FULLY_MANAGED;
    options = {
        resourceName,
        dependsOn: updatedDependsOn,
        deploymentMechanism,
        imageSource,
        restrictAccess,
        build,
        providerPlugin: 'awscloudformation',
        service: 'ElasticContainer',
        gitHubInfo,
        authName,
        environmentMap,
        categoryPolicies,
        mutableParametersState,
        skipHashing: false,
        apiType,
        iamAccessUnavailable: true,
    };
    await context.amplify.updateamplifyMetaAfterResourceAdd(category, resourceName, options);
    const apiResource = (await context.amplify.getProjectMeta().api[resourceName]);
    apiResource.category = category;
    fs.ensureDirSync(resourceDirPath);
    fs.ensureDirSync(path.join(resourceDirPath, 'src'));
    if (imageSource.type === containers_walkthrough_1.IMAGE_SOURCE_TYPE.TEMPLATE) {
        fs.copySync(path.join(__dirname, '..', '..', '..', 'resources', 'awscloudformation/container-templates', imageSource.template), path.join(resourceDirPath, 'src'), { recursive: true });
        const { exposedContainer } = await (0, containers_artifacts_1.generateContainersArtifacts)(context, apiResource);
        await context.amplify.updateamplifyMetaAfterResourceUpdate(category, options.resourceName, 'exposedContainer', exposedContainer);
    }
    (0, amplify_cli_core_1.createDefaultCustomPoliciesFile)(category, resourceName);
    const customPoliciesPath = amplify_cli_core_1.pathManager.getCustomPoliciesPath(category, resourceName);
    amplify_prompts_1.printer.success(`Successfully added resource ${resourceName} locally.`);
    amplify_prompts_1.printer.info('');
    amplify_prompts_1.printer.success('Next steps:');
    if (deploymentMechanism === base_api_stack_1.DEPLOYMENT_MECHANISM.FULLY_MANAGED) {
        amplify_prompts_1.printer.info(`- Place your Dockerfile, docker-compose.yml and any related container source files in "amplify/backend/api/${resourceName}/src"`);
    }
    else if (deploymentMechanism === base_api_stack_1.DEPLOYMENT_MECHANISM.INDENPENDENTLY_MANAGED) {
        amplify_prompts_1.printer.info(`- Ensure you have the Dockerfile, docker-compose.yml and any related container source files in your Github path: ${gitHubInfo.path}`);
    }
    amplify_prompts_1.printer.info(`- Amplify CLI infers many configuration settings from the "docker-compose.yaml" file. Learn more: docs.amplify.aws/cli/usage/containers`);
    amplify_prompts_1.printer.info(`- To access AWS resources outside of this Amplify app, edit the ${customPoliciesPath}`);
    amplify_prompts_1.printer.info('- Run "amplify push" to build and deploy your image');
    return resourceName;
};
exports.addResource = addResource;
const getResourceDependencies = async ({ restrictAccess, dependsOn, context, resourceName, category, }) => {
    let authName;
    const updatedDependsOn = [].concat(dependsOn);
    updatedDependsOn.push({
        category: '',
        resourceName: category_constants_1.NETWORK_STACK_LOGICAL_ID,
        attributes: ['ClusterName', 'VpcId', 'VpcCidrBlock', 'SubnetIds', 'VpcLinkId', 'CloudMapNamespaceId'],
    });
    if (restrictAccess) {
        const apiRequirements = { authSelections: 'identityPoolAndUserPool' };
        const satisfiedRequirements = await context.amplify.invokePluginMethod(context, 'auth', undefined, 'checkRequirements', [
            apiRequirements,
            context,
            'api',
            resourceName,
        ]);
        const foundUnmetRequirements = Object.values(satisfiedRequirements).includes(false);
        if (foundUnmetRequirements) {
            try {
                authName = await context.amplify.invokePluginMethod(context, 'auth', undefined, 'externalAuthEnable', [
                    context,
                    'api',
                    resourceName,
                    apiRequirements,
                ]);
            }
            catch (e) {
                amplify_prompts_1.printer.error(e);
                throw e;
            }
        }
        else {
            [authName] = Object.keys(context.amplify.getProjectDetails().amplifyMeta.auth);
        }
        const authDependency = updatedDependsOn.find((dependency) => dependency.category === 'auth');
        if (authDependency === undefined) {
            updatedDependsOn.push({
                category: 'auth',
                resourceName: authName,
                attributes: ['UserPoolId', 'AppClientIDWeb'],
            });
        }
        else {
            const existingAttributes = authDependency.attributes;
            const newAttributes = new Set([...existingAttributes, 'UserPoolId', 'AppClientIDWeb']);
            authDependency.attributes = Array.from(newAttributes);
        }
    }
    return [authName, updatedDependsOn];
};
const updateResource = async (serviceWalkthroughPromise, context, category) => {
    const options = await serviceWalkthroughPromise;
    const { dependsOn, restrictAccess, resourceName, gitHubPath, gitHubToken, gitHubInfo, mutableParametersState, categoryPolicies, environmentMap, deploymentMechanism, } = options;
    let [authResourceName, updatedDependsOn] = await getResourceDependencies({ dependsOn, restrictAccess, category, resourceName, context });
    let newGithubInfo = {
        path: gitHubPath,
        tokenSecretArn: gitHubInfo && gitHubInfo.tokenSecretArn,
    };
    if (gitHubToken) {
        const { StackName } = context.amplify.getProjectDetails().amplifyMeta.providers['awscloudformation'];
        const secretName = `${StackName}-${category}-${resourceName}-github-token`;
        const { ARN: secretArn } = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'updateSecret', {
            secret: gitHubToken,
            description: 'GitHub OAuth token',
            name: secretName,
            version: (0, uuid_1.v4)(),
        });
        newGithubInfo.tokenSecretArn = secretArn;
    }
    if (deploymentMechanism === base_api_stack_1.DEPLOYMENT_MECHANISM.INDENPENDENTLY_MANAGED) {
        await context.amplify.updateamplifyMetaAfterResourceUpdate(category, options.resourceName, 'gitHubInfo', newGithubInfo);
    }
    await context.amplify.updateamplifyMetaAfterResourceUpdate(category, options.resourceName, 'restrictAccess', restrictAccess);
    await context.amplify.updateamplifyMetaAfterResourceUpdate(category, options.resourceName, 'authName', authResourceName);
    await context.amplify.updateamplifyMetaAfterResourceUpdate(category, options.resourceName, 'environmentMap', environmentMap);
    await context.amplify.updateamplifyMetaAfterResourceUpdate(category, options.resourceName, 'dependsOn', updatedDependsOn);
    await context.amplify.updateamplifyMetaAfterResourceUpdate(category, options.resourceName, 'mutableParametersState', mutableParametersState);
    await context.amplify.updateamplifyMetaAfterResourceUpdate(category, options.resourceName, 'categoryPolicies', categoryPolicies);
    const apiResource = (await context.amplify.getProjectMeta().api[options.resourceName]);
    apiResource.category = category;
    try {
        const askForExposedContainer = true;
        const { exposedContainer } = await (0, containers_artifacts_1.generateContainersArtifacts)(context, apiResource, askForExposedContainer);
        await context.amplify.updateamplifyMetaAfterResourceUpdate(category, options.resourceName, 'exposedContainer', exposedContainer);
    }
    catch (err) {
    }
};
exports.updateResource = updateResource;
//# sourceMappingURL=containers-handler.js.map