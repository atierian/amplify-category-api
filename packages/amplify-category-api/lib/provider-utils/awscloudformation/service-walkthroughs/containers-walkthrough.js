"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPermissionPolicies = exports.updateWalkthrough = exports.IMAGE_SOURCE_TYPE = exports.serviceWalkthrough = exports.API_TYPE = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const inquirer_1 = __importDefault(require("inquirer"));
const category_constants_1 = require("../../../category-constants");
const base_api_stack_1 = require("../base-api-stack");
const containers_defaults_1 = require("../default-values/containers-defaults");
const serviceName = 'ElasticContainer';
var API_TYPE;
(function (API_TYPE) {
    API_TYPE["GRAPHQL"] = "GRAPHQL";
    API_TYPE["REST"] = "REST";
})(API_TYPE = exports.API_TYPE || (exports.API_TYPE = {}));
async function serviceWalkthrough(context, apiType) {
    const allDefaultValues = (0, containers_defaults_1.getAllDefaults)();
    const resourceName = await askResourceName(context, allDefaultValues);
    const containerInfo = await askContainerSource(context, resourceName, apiType);
    return { resourceName, ...containerInfo };
}
exports.serviceWalkthrough = serviceWalkthrough;
async function askResourceName(context, allDefaultValues) {
    const { amplify } = context;
    const { resourceName } = await inquirer_1.default.prompt([
        {
            name: 'resourceName',
            type: 'input',
            message: 'Provide a friendly name for your resource to be used as a label for this category in the project:',
            default: allDefaultValues.resourceName,
            validate: amplify.inputValidation({
                validation: {
                    operator: 'regex',
                    value: '^[a-z0-9]+$',
                    onErrorMsg: 'Resource name should be alphanumeric with no uppercase letters',
                },
                required: true,
            }),
        },
    ]);
    return resourceName;
}
async function askContainerSource(context, resourceName, apiType) {
    return newContainer(context, resourceName, apiType);
}
var IMAGE_SOURCE_TYPE;
(function (IMAGE_SOURCE_TYPE) {
    IMAGE_SOURCE_TYPE["TEMPLATE"] = "TEMPLATE";
    IMAGE_SOURCE_TYPE["CUSTOM"] = "CUSTOM";
})(IMAGE_SOURCE_TYPE = exports.IMAGE_SOURCE_TYPE || (exports.IMAGE_SOURCE_TYPE = {}));
async function newContainer(context, resourceName, apiType) {
    let imageSource;
    let choices = [];
    if (apiType === API_TYPE.GRAPHQL) {
        choices.push({
            name: 'ExpressJS - GraphQL template',
            value: { type: IMAGE_SOURCE_TYPE.TEMPLATE, template: 'graphql-express' },
        });
    }
    if (apiType === API_TYPE.REST) {
        choices.push({
            name: 'ExpressJS - REST template',
            value: { type: IMAGE_SOURCE_TYPE.TEMPLATE, template: 'dockerfile-rest-express' },
        });
        choices.push({
            name: 'Docker Compose - ExpressJS + Flask template',
            value: { type: IMAGE_SOURCE_TYPE.TEMPLATE, template: 'dockercompose-rest-express' },
        });
    }
    choices = choices.concat([
        {
            name: 'Custom (bring your own Dockerfile or docker-compose.yml)',
            value: { type: IMAGE_SOURCE_TYPE.CUSTOM },
        },
        {
            name: 'Learn More',
            value: undefined,
        },
    ]);
    do {
        ({ imageSource } = await inquirer_1.default.prompt([
            {
                name: 'imageSource',
                type: 'list',
                message: 'What image would you like to use',
                choices,
                default: 'express_hello_world',
            },
        ]));
    } while (imageSource === undefined);
    let deploymentMechanismQuestion;
    const deploymentMechanismChoices = [
        {
            name: 'On every "amplify push" (Fully managed container source)',
            value: base_api_stack_1.DEPLOYMENT_MECHANISM.FULLY_MANAGED,
        },
    ];
    if (imageSource.type === IMAGE_SOURCE_TYPE.CUSTOM) {
        deploymentMechanismChoices.push({
            name: 'On every Github commit (Independently managed container source)',
            value: base_api_stack_1.DEPLOYMENT_MECHANISM.INDENPENDENTLY_MANAGED,
        });
    }
    deploymentMechanismChoices.push({
        name: 'Advanced: Self-managed (Learn more: docs.amplify.aws/cli/usage/containers)',
        value: base_api_stack_1.DEPLOYMENT_MECHANISM.SELF_MANAGED,
    });
    do {
        deploymentMechanismQuestion = await inquirer_1.default.prompt([
            {
                name: 'deploymentMechanism',
                type: 'list',
                message: 'When do you want to build & deploy the Fargate task',
                choices: deploymentMechanismChoices,
            },
        ]);
    } while (deploymentMechanismQuestion.deploymentMechanism === 'Learn More');
    let gitHubPath;
    let gitHubToken;
    if (deploymentMechanismQuestion.deploymentMechanism === base_api_stack_1.DEPLOYMENT_MECHANISM.INDENPENDENTLY_MANAGED) {
        amplify_prompts_1.printer.info('We need a Github Personal Access Token to automatically build & deploy your Fargate task on every Github commit.');
        amplify_prompts_1.printer.info('Learn more about Github Personal Access Token here: https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/creating-a-personal-access-token');
        const gitHubQuestions = await inquirer_1.default.prompt([
            {
                name: 'github_access_token',
                type: 'password',
                message: 'GitHub Personal Access Token:',
            },
            {
                name: 'github_path',
                type: 'input',
                message: 'Path to your repo:',
            },
        ]);
        gitHubPath = gitHubQuestions.github_path;
        gitHubToken = gitHubQuestions.github_access_token;
    }
    const meta = context.amplify.getProjectDetails().amplifyMeta;
    const hasAccessableResources = ['storage', 'function'].some((categoryName) => {
        var _a;
        return Object.keys((_a = meta[categoryName]) !== null && _a !== void 0 ? _a : {}).length > 0;
    });
    let rolePermissions = {};
    if (hasAccessableResources &&
        (await context.amplify.confirmPrompt('Do you want to access other resources in this project from your api?'))) {
        rolePermissions = await context.amplify.invokePluginMethod(context, 'function', undefined, 'askExecRolePermissionsQuestions', [
            context,
            resourceName,
            undefined,
            undefined,
            category_constants_1.category,
            serviceName,
        ]);
    }
    const { categoryPolicies, environmentMap, dependsOn, mutableParametersState } = rolePermissions;
    const restrictApiQuestion = await inquirer_1.default.prompt({
        name: 'rescrict_access',
        type: 'confirm',
        message: 'Do you want to restrict API access',
        default: true,
    });
    return {
        imageSource,
        gitHubPath,
        gitHubToken,
        deploymentMechanism: deploymentMechanismQuestion.deploymentMechanism,
        restrictAccess: restrictApiQuestion.rescrict_access,
        categoryPolicies,
        environmentMap,
        dependsOn,
        mutableParametersState,
    };
}
async function updateWalkthrough(context, apiType) {
    const { allResources } = await context.amplify.getResourceStatus();
    const resources = allResources
        .filter((resource) => resource.category === category_constants_1.category && resource.service === serviceName && !!resource.providerPlugin && resource.apiType === apiType)
        .map((resource) => resource.resourceName);
    if (resources.length === 0) {
        const errMessage = `No ${apiType} API resource to update. Use "amplify add api" command to create a new ${apiType} API`;
        amplify_prompts_1.printer.error(errMessage);
        await context.usageData.emitError(new amplify_cli_core_1.ResourceDoesNotExistError(errMessage));
        (0, amplify_cli_core_1.exitOnNextTick)(0);
        return;
    }
    const question = [
        {
            name: 'resourceName',
            message: 'Please select the API you would want to update',
            type: 'list',
            choices: resources,
        },
    ];
    const { resourceName } = await inquirer_1.default.prompt(question);
    const resourceSettings = allResources.find((resource) => resource.resourceName === resourceName &&
        resource.category === category_constants_1.category &&
        resource.service === serviceName &&
        !!resource.providerPlugin);
    let { gitHubInfo: { path = undefined } = {} } = resourceSettings;
    let gitHubToken;
    if (resourceSettings.deploymentMechanism === base_api_stack_1.DEPLOYMENT_MECHANISM.INDENPENDENTLY_MANAGED) {
        if (await confirm('Would you like to change your GitHub access token')) {
            const gitHubQuestion = await inquirer_1.default.prompt({
                name: 'gitHubAccessToken',
                type: 'password',
                message: 'GitHub Personal Access Token:',
            });
            gitHubToken = gitHubQuestion.gitHubAccessToken;
        }
        if (await confirm('Would you like to change your GitHub Path to your repo')) {
            const gitHubQuestion = await inquirer_1.default.prompt({
                name: 'gitHubPath',
                type: 'input',
                message: 'Path to your repo:',
                default: path,
            });
            path = gitHubQuestion.gitHubPath;
        }
    }
    const { environmentMap = {}, mutableParametersState = {} } = resourceSettings;
    const meta = context.amplify.getProjectDetails().amplifyMeta;
    const hasAccessableResources = ['storage', 'function'].some((categoryName) => {
        var _a;
        return Object.keys((_a = meta[categoryName]) !== null && _a !== void 0 ? _a : {}).length > 0;
    });
    let rolePermissions = {};
    if (hasAccessableResources &&
        (await context.amplify.confirmPrompt('Do you want to access other resources in this project from your api?'))) {
        rolePermissions = await context.amplify.invokePluginMethod(context, 'function', undefined, 'askExecRolePermissionsQuestions', [
            context,
            resourceName,
            mutableParametersState.permissions,
            environmentMap,
            category_constants_1.category,
            serviceName,
        ]);
    }
    const { categoryPolicies = [], environmentMap: newEnvironmentMap, dependsOn: newDependsOn = [], mutableParametersState: newMutableParametersState, } = rolePermissions;
    const { restrict_access: restrictAccess } = await inquirer_1.default.prompt({
        name: 'restrict_access',
        type: 'confirm',
        message: 'Do you want to restrict API access',
        default: resourceSettings.restrictAccess,
    });
    return {
        ...resourceSettings,
        restrictAccess,
        environmentMap: newEnvironmentMap,
        mutableParametersState: newMutableParametersState,
        dependsOn: newDependsOn,
        categoryPolicies,
        gitHubPath: path,
        gitHubToken,
    };
}
exports.updateWalkthrough = updateWalkthrough;
async function confirm(question) {
    const { confirm } = await inquirer_1.default.prompt({
        type: 'confirm',
        default: false,
        message: question,
        name: 'confirm',
    });
    return confirm;
}
async function getPermissionPolicies(context, service, resourceName, crudOptions) {
    throw new Error('IAM access not available for this resource');
}
exports.getPermissionPolicies = getPermissionPolicies;
//# sourceMappingURL=containers-walkthrough.js.map