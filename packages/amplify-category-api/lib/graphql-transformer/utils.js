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
exports.writeDeploymentToDisk = exports.mergeUserConfigWithTransformOutput = exports.getAdminRoles = exports.getIdentityPoolId = void 0;
const path = __importStar(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const rimraf_1 = __importDefault(require("rimraf"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const cloudform_types_1 = require("cloudform-types");
const graphql_transformer_common_1 = require("graphql-transformer-common");
const lodash_1 = require("lodash");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const PARAMETERS_FILE_NAME = 'parameters.json';
const CUSTOM_ROLES_FILE_NAME = 'custom-roles.json';
const AMPLIFY_ADMIN_ROLE = '_Full-access/CognitoIdentityCredentials';
const AMPLIFY_MANAGE_ROLE = '_Manage-only/CognitoIdentityCredentials';
const PROVIDER_NAME = 'awscloudformation';
const getIdentityPoolId = async (ctx) => {
    var _a;
    const { allResources, resourcesToBeDeleted } = await ctx.amplify.getResourceStatus('auth');
    const authResources = (0, lodash_1.pullAllBy)(allResources, resourcesToBeDeleted, 'resourceName');
    const authResource = (0, lodash_1.find)(authResources, { service: 'Cognito', providerPlugin: PROVIDER_NAME });
    return (_a = authResource === null || authResource === void 0 ? void 0 : authResource.output) === null || _a === void 0 ? void 0 : _a.IdentityPoolId;
};
exports.getIdentityPoolId = getIdentityPoolId;
const getAdminRoles = async (ctx, apiResourceName) => {
    var _a, _b;
    let currentEnv;
    const adminRoles = new Array();
    try {
        currentEnv = ctx.amplify.getEnvInfo().envName;
    }
    catch (err) {
        return [];
    }
    try {
        const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
        const appId = (_b = (_a = amplifyMeta === null || amplifyMeta === void 0 ? void 0 : amplifyMeta.providers) === null || _a === void 0 ? void 0 : _a[PROVIDER_NAME]) === null || _b === void 0 ? void 0 : _b.AmplifyAppId;
        const res = await amplify_cli_core_1.CloudformationProviderFacade.isAmplifyAdminApp(ctx, appId);
        if (res.userPoolID) {
            adminRoles.push(`${res.userPoolID}${AMPLIFY_ADMIN_ROLE}`, `${res.userPoolID}${AMPLIFY_MANAGE_ROLE}`);
        }
    }
    catch (err) {
    }
    if (apiResourceName) {
        const { allResources, resourcesToBeDeleted } = await ctx.amplify.getResourceStatus('function');
        const resources = (0, lodash_1.pullAllBy)(allResources, resourcesToBeDeleted, 'resourceName')
            .filter((r) => { var _a; return (_a = r.dependsOn) === null || _a === void 0 ? void 0 : _a.some((d) => (d === null || d === void 0 ? void 0 : d.resourceName) === apiResourceName); })
            .map((r) => `${r.resourceName}-${currentEnv}`);
        adminRoles.push(...resources);
        const customRoleFile = path.join(amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, amplify_cli_core_1.AmplifyCategories.API, apiResourceName), CUSTOM_ROLES_FILE_NAME);
        if (fs_extra_1.default.existsSync(customRoleFile)) {
            const customRoleConfig = amplify_cli_core_1.JSONUtilities.readJson(customRoleFile);
            if (customRoleConfig && customRoleConfig.adminRoleNames) {
                const customAdminRoles = Array.isArray(customRoleConfig.adminRoleNames)
                    ? customRoleConfig.adminRoleNames
                    : [customRoleConfig.adminRoleNames];
                const adminRoleNames = customAdminRoles
                    .map((r) => (r.includes('${env}') ? r.replace('${env}', currentEnv) : r));
                adminRoles.push(...adminRoleNames);
            }
        }
    }
    return adminRoles;
};
exports.getAdminRoles = getAdminRoles;
function mergeUserConfigWithTransformOutput(userConfig, transformOutput, opts) {
    const userFunctions = userConfig.functions || {};
    const userResolvers = userConfig.resolvers || {};
    const userPipelineFunctions = userConfig.pipelineFunctions || {};
    const { functions } = transformOutput;
    const { resolvers } = transformOutput;
    const { pipelineFunctions } = transformOutput;
    if (!(opts === null || opts === void 0 ? void 0 : opts.disableFunctionOverrides)) {
        for (const userFunction of Object.keys(userFunctions)) {
            functions[userFunction] = userFunctions[userFunction];
        }
    }
    if (!(opts === null || opts === void 0 ? void 0 : opts.disablePipelineFunctionOverrides)) {
        const pipelineFunctionKeys = Object.keys(userPipelineFunctions);
        if (pipelineFunctionKeys.length > 0) {
            amplify_prompts_1.printer.warn(' You are using the "pipelineFunctions" directory for overridden and custom resolvers. ' +
                'Please use the "resolvers" directory as "pipelineFunctions" will be deprecated.\n');
        }
        for (const userPipelineFunction of pipelineFunctionKeys)
            resolvers[userPipelineFunction] = userPipelineFunctions[userPipelineFunction];
    }
    if (!(opts === null || opts === void 0 ? void 0 : opts.disableResolverOverrides)) {
        for (const userResolver of Object.keys(userResolvers)) {
            if (userResolver !== 'README.md') {
                resolvers[userResolver] = userResolvers[userResolver].toString();
            }
        }
    }
    const stacks = overrideUserDefinedStacks(userConfig, transformOutput);
    return {
        ...transformOutput,
        functions,
        resolvers,
        pipelineFunctions,
        stacks,
    };
}
exports.mergeUserConfigWithTransformOutput = mergeUserConfigWithTransformOutput;
function overrideUserDefinedStacks(userConfig, transformOutput) {
    const userStacks = userConfig.stacks || {};
    const { stacks, rootStack } = transformOutput;
    const resourceTypesToDependOn = {
        'AWS::CloudFormation::Stack': true,
        'AWS::AppSync::GraphQLApi': true,
        'AWS::AppSync::GraphQLSchema': true,
    };
    const allResourceIds = Object.keys(rootStack.Resources).filter((k) => {
        const resource = rootStack.Resources[k];
        return resourceTypesToDependOn[resource.Type];
    });
    const parametersKeys = Object.keys(rootStack.Parameters);
    const customStackParams = parametersKeys.reduce((acc, k) => ({
        ...acc,
        [k]: cloudform_types_1.Fn.Ref(k),
    }), {});
    customStackParams[graphql_transformer_common_1.ResourceConstants.PARAMETERS.AppSyncApiId] = cloudform_types_1.Fn.GetAtt(graphql_transformer_common_1.ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId');
    const updatedParameters = rootStack.Parameters;
    for (const userStack of Object.keys(userStacks)) {
        if (stacks[userStack]) {
            throw new Error(`You cannot provide a stack named ${userStack} as it \
            will be overwritten by a stack generated by the GraphQL Transform.`);
        }
        const userDefinedStack = userStacks[userStack];
        for (const key of Object.keys(userDefinedStack.Parameters)) {
            if (customStackParams[key] == null) {
                customStackParams[key] = cloudform_types_1.Fn.Ref(key);
                if (updatedParameters[key])
                    throw new Error(`Cannot redefine CloudFormation parameter ${key} in stack ${userStack}.`);
                else
                    updatedParameters[key] = userDefinedStack.Parameters[key];
            }
        }
        const parametersForStack = Object.keys(userDefinedStack.Parameters).reduce((acc, k) => ({
            ...acc,
            [k]: customStackParams[k],
        }), {});
        stacks[userStack] = userDefinedStack;
        const stackResourceId = userStack.split(/[^A-Za-z]/).join('');
        const customNestedStack = new cloudform_types_1.CloudFormation.Stack({
            Parameters: parametersForStack,
            TemplateURL: cloudform_types_1.Fn.Join('/', [
                'https://s3.amazonaws.com',
                cloudform_types_1.Fn.Ref(graphql_transformer_common_1.ResourceConstants.PARAMETERS.S3DeploymentBucket),
                cloudform_types_1.Fn.Ref(graphql_transformer_common_1.ResourceConstants.PARAMETERS.S3DeploymentRootKey),
                'stacks',
                userStack,
            ]),
        }).dependsOn(allResourceIds);
        rootStack.Resources[stackResourceId] = customNestedStack;
    }
    rootStack.Parameters = updatedParameters;
    return stacks;
}
async function writeDeploymentToDisk(context, deployment, directory, rootStackFileName = 'rootStack.json', buildParameters) {
    fs_extra_1.default.ensureDirSync(directory);
    emptyBuildDirPreserveTsconfig(directory);
    const { schema } = deployment;
    const fullSchemaPath = path.normalize(`${directory}/schema.graphql`);
    fs_extra_1.default.writeFileSync(fullSchemaPath, schema);
    initStacksAndResolversDirectories(directory);
    const resolverFileNames = Object.keys(deployment.resolvers);
    const resolverRootPath = resolverDirectoryPath(directory);
    for (const resolverFileName of resolverFileNames) {
        const fullResolverPath = path.normalize(`${resolverRootPath}/${resolverFileName}`);
        fs_extra_1.default.writeFileSync(fullResolverPath, deployment.resolvers[resolverFileName]);
    }
    const pipelineFunctions = Object.keys(deployment.pipelineFunctions);
    const pipelineFunctionRootPath = pipelineFunctionDirectoryPath(directory);
    for (const functionFileName of pipelineFunctions) {
        const fullTemplatePath = path.normalize(`${pipelineFunctionRootPath}/${functionFileName}`);
        fs_extra_1.default.writeFileSync(fullTemplatePath, deployment.pipelineFunctions[functionFileName]);
    }
    const stackNames = Object.keys(deployment.stacks);
    const stackRootPath = stacksDirectoryPath(directory);
    for (const stackFileName of stackNames) {
        const fileNameParts = stackFileName.split('.');
        if (fileNameParts.length === 1) {
            fileNameParts.push('json');
        }
        const fullFileName = fileNameParts.join('.');
        throwIfNotJSONExt(fullFileName);
        const fullStackPath = path.normalize(`${stackRootPath}/${fullFileName}`);
        let stackContent = deployment.stacks[stackFileName];
        if (typeof stackContent === 'string') {
            stackContent = JSON.parse(stackContent);
        }
        await amplify_cli_core_1.CloudformationProviderFacade.prePushCfnTemplateModifier(context, stackContent);
        fs_extra_1.default.writeFileSync(fullStackPath, amplify_cli_core_1.JSONUtilities.stringify(stackContent));
    }
    const functionNames = Object.keys(deployment.functions);
    const functionRootPath = path.normalize(`${directory}/functions`);
    if (!fs_extra_1.default.existsSync(functionRootPath)) {
        fs_extra_1.default.mkdirSync(functionRootPath);
    }
    for (const functionName of functionNames) {
        const fullFunctionPath = path.normalize(`${functionRootPath}/${functionName}`);
        const zipContents = fs_extra_1.default.readFileSync(deployment.functions[functionName]);
        fs_extra_1.default.writeFileSync(fullFunctionPath, zipContents);
    }
    const { rootStack } = deployment;
    const rootStackPath = path.normalize(`${directory}/${rootStackFileName}`);
    const rootStackString = JSON.stringify(rootStack, null, 4);
    fs_extra_1.default.writeFileSync(rootStackPath, rootStackString);
    const jsonString = JSON.stringify(buildParameters, null, 4);
    const parametersOutputFilePath = path.join(directory, PARAMETERS_FILE_NAME);
    fs_extra_1.default.writeFileSync(parametersOutputFilePath, jsonString);
}
exports.writeDeploymentToDisk = writeDeploymentToDisk;
function initStacksAndResolversDirectories(directory) {
    const resolverRootPath = resolverDirectoryPath(directory);
    if (!fs_extra_1.default.existsSync(resolverRootPath)) {
        fs_extra_1.default.mkdirSync(resolverRootPath);
    }
    const stackRootPath = stacksDirectoryPath(directory);
    if (!fs_extra_1.default.existsSync(stackRootPath)) {
        fs_extra_1.default.mkdirSync(stackRootPath);
    }
}
function pipelineFunctionDirectoryPath(rootPath) {
    return path.normalize(path.join(rootPath, 'pipelineFunctions'));
}
function resolverDirectoryPath(rootPath) {
    return path.normalize(`${rootPath}/resolvers`);
}
function stacksDirectoryPath(rootPath) {
    return path.normalize(`${rootPath}/stacks`);
}
function throwIfNotJSONExt(stackFile) {
    const extension = path.extname(stackFile);
    if (extension === '.yaml' || extension === '.yml') {
        throw new Error(`Yaml is not yet supported. Please convert the CloudFormation stack ${stackFile} to json.`);
    }
    if (extension !== '.json') {
        throw new Error(`Invalid extension ${extension} for stack ${stackFile}`);
    }
}
const emptyBuildDirPreserveTsconfig = (directory) => {
    const files = fs_extra_1.default.readdirSync(directory);
    files.forEach((file) => {
        const fileDir = path.join(directory, file);
        if (fs_extra_1.default.lstatSync(fileDir).isDirectory()) {
            rimraf_1.default.sync(fileDir);
        }
        else if (!file.endsWith('tsconfig.resource.json')) {
            fs_extra_1.default.unlinkSync(fileDir);
        }
    });
};
//# sourceMappingURL=utils.js.map