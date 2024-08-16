"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformGraphQLSchemaV1 = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const graphql_transformer_common_1 = require("graphql-transformer-common");
const graphql_transformer_core_1 = require("graphql-transformer-core");
const auth_mode_compare_1 = require("./auth-mode-compare");
const amplify_cli_feature_flag_adapter_1 = require("./amplify-cli-feature-flag-adapter");
const api_utils_1 = require("./api-utils");
const transformer_factory_1 = require("./transformer-factory");
const apiCategory = 'api';
const parametersFileName = 'parameters.json';
const schemaFileName = 'schema.graphql';
const schemaDirName = 'schema';
const ROOT_APPSYNC_S3_KEY = 'amplify-appsync-files';
const DESTRUCTIVE_UPDATES_FLAG = 'allow-destructive-graphql-schema-updates';
const PROVIDER_NAME = 'awscloudformation';
async function warnOnAuth(context, map) {
    const unAuthModelTypes = Object.keys(map).filter((type) => !map[type].includes('auth') && map[type].includes('model'));
    if (unAuthModelTypes.length) {
        const transformerVersion = await amplify_cli_core_1.ApiCategoryFacade.getTransformerVersion(context);
        const docLink = (0, amplify_cli_core_1.getGraphQLTransformerAuthDocLink)(transformerVersion);
        context.print.warning("\nThe following types do not have '@auth' enabled. Consider using @auth with @model");
        context.print.warning(unAuthModelTypes.map((type) => `\t - ${type}`).join('\n'));
        context.print.info(`Learn more about @auth here: ${docLink}\n`);
    }
}
async function transformerVersionCheck(context, resourceDir, cloudBackendDirectory, updatedResources, usedDirectives) {
    const transformerVersion = await amplify_cli_core_1.ApiCategoryFacade.getTransformerVersion(context);
    const authDocLink = (0, amplify_cli_core_1.getGraphQLTransformerAuthSubscriptionsDocLink)(transformerVersion);
    const searchable = (0, amplify_cli_core_1.getGraphQLTransformerOpenSearchProductionDocLink)(transformerVersion);
    const versionChangeMessage = `The default behavior for @auth has changed in the latest version of Amplify\nRead here for details: ${authDocLink}`;
    const warningESMessage = `The behavior for @searchable has changed after version 4.14.1.\nRead here for details: ${searchable}`;
    const checkVersionExist = (config) => config && config.Version;
    const checkESWarningExists = (config) => config && config.ElasticsearchWarning;
    let writeToConfig = false;
    const cloudTransformerConfig = await (0, graphql_transformer_core_1.readTransformerConfiguration)(cloudBackendDirectory);
    const cloudVersionExist = checkVersionExist(cloudTransformerConfig);
    const cloudWarningExist = checkESWarningExists(cloudTransformerConfig);
    const localTransformerConfig = await (0, graphql_transformer_core_1.readTransformerConfiguration)(resourceDir);
    const localVersionExist = checkVersionExist(localTransformerConfig);
    const localWarningExist = checkESWarningExists(localTransformerConfig);
    const showPrompt = !(cloudVersionExist || localVersionExist);
    const showWarning = !(cloudWarningExist || localWarningExist);
    const resources = updatedResources.filter((resource) => resource.service === 'AppSync');
    if (resources.length > 0) {
        if (showPrompt && usedDirectives.includes('auth')) {
            await warningMessage(context, versionChangeMessage);
        }
        if (showWarning && usedDirectives.includes('searchable')) {
            await warningMessage(context, warningESMessage);
        }
    }
    if (!localTransformerConfig.Version) {
        localTransformerConfig.Version = graphql_transformer_core_1.TRANSFORM_BASE_VERSION;
        writeToConfig = true;
    }
    if (!localTransformerConfig.warningESMessage) {
        localTransformerConfig.ElasticsearchWarning = true;
        writeToConfig = true;
    }
    if (writeToConfig) {
        await (0, graphql_transformer_core_1.writeTransformerConfiguration)(resourceDir, localTransformerConfig);
    }
}
async function warningMessage(context, warningMessage) {
    if (context.exeInfo && context.exeInfo.inputParams && context.exeInfo.inputParams.yes) {
        context.print.warning(`\n${warningMessage}\n`);
    }
    else {
        context.print.warning(`\n${warningMessage}\n`);
        const response = await inquirer_1.default.prompt({
            name: 'transformerConfig',
            type: 'confirm',
            message: `Do you wish to continue?`,
            default: false,
        });
        if (!response.transformerConfig) {
            await context.usageData.emitSuccess();
            (0, amplify_cli_core_1.exitOnNextTick)(0);
        }
    }
}
function apiProjectIsFromOldVersion(pathToProject, resourcesToBeCreated) {
    const resources = resourcesToBeCreated.filter((resource) => resource.service === 'AppSync');
    if (!pathToProject || resources.length > 0) {
        return false;
    }
    return fs_extra_1.default.existsSync(`${pathToProject}/${graphql_transformer_core_1.CLOUDFORMATION_FILE_NAME}`) && !fs_extra_1.default.existsSync(`${pathToProject}/${graphql_transformer_core_1.TRANSFORM_CONFIG_FILE_NAME}`);
}
async function migrateProject(context, options) {
    const { resourceDir, isCLIMigration, cloudBackendDirectory } = options;
    const updateAndWaitForStack = options.handleMigration || (() => Promise.resolve('Skipping update'));
    let oldProjectConfig;
    let oldCloudBackend;
    try {
        context.print.info('\nMigrating your API. This may take a few minutes.');
        const { project, cloudBackend } = await (0, graphql_transformer_core_1.migrateAPIProject)({
            projectDirectory: resourceDir,
            cloudBackendDirectory,
        });
        oldProjectConfig = project;
        oldCloudBackend = cloudBackend;
        await updateAndWaitForStack({ isCLIMigration });
    }
    catch (e) {
        await (0, graphql_transformer_core_1.revertAPIMigration)(resourceDir, oldProjectConfig);
        throw e;
    }
    try {
        options.cloudBackendDirectory = resourceDir;
        await transformGraphQLSchemaV1(context, options);
        const result = await updateAndWaitForStack({ isCLIMigration });
        context.print.info('\nFinished migrating API.');
        return result;
    }
    catch (e) {
        context.print.error('Reverting API migration.');
        await (0, graphql_transformer_core_1.revertAPIMigration)(resourceDir, oldCloudBackend);
        try {
            await updateAndWaitForStack({ isReverting: true, isCLIMigration });
        }
        catch (e) {
            context.print.error('Error reverting intermediate migration stack.');
        }
        await (0, graphql_transformer_core_1.revertAPIMigration)(resourceDir, oldProjectConfig);
        context.print.error('API successfully reverted.');
        throw e;
    }
}
async function transformGraphQLSchemaV1(context, options) {
    var _a, _b, _c, _d;
    const backEndDir = context.amplify.pathManager.getBackendDirPath();
    const flags = context.parameters.options;
    if (flags['no-gql-override']) {
        return;
    }
    let { resourceDir, parameters } = options;
    const { forceCompile } = options;
    const { resourcesToBeCreated, resourcesToBeUpdated, allResources } = await context.amplify.getResourceStatus(apiCategory);
    let resources = resourcesToBeCreated.concat(resourcesToBeUpdated);
    const resourceNeedCompile = allResources
        .filter((r) => !resources.includes(r))
        .filter((r) => {
        const buildDir = path_1.default.normalize(path_1.default.join(backEndDir, apiCategory, r.resourceName, 'build'));
        return !fs_extra_1.default.existsSync(buildDir);
    });
    resources = resources.concat(resourceNeedCompile);
    if (forceCompile) {
        resources = resources.concat(allResources);
    }
    resources = resources.filter((resource) => resource.service === 'AppSync');
    const isNewAppSyncAPI = resourcesToBeCreated.filter((resource) => resource.service === 'AppSync').length !== 0;
    if (!resourceDir) {
        if (resources.length > 0) {
            const resource = resources[0];
            if (resource.providerPlugin !== PROVIDER_NAME) {
                return;
            }
            const { category, resourceName } = resource;
            resourceDir = path_1.default.normalize(path_1.default.join(backEndDir, category, resourceName));
        }
        else {
            return;
        }
    }
    let previouslyDeployedBackendDir = options.cloudBackendDirectory;
    if (!previouslyDeployedBackendDir) {
        if (resources.length > 0) {
            const resource = resources[0];
            if (resource.providerPlugin !== PROVIDER_NAME) {
                return;
            }
            const { category, resourceName } = resource;
            const cloudBackendRootDir = context.amplify.pathManager.getCurrentCloudBackendDirPath();
            previouslyDeployedBackendDir = path_1.default.normalize(path_1.default.join(cloudBackendRootDir, category, resourceName));
        }
    }
    const parametersFilePath = path_1.default.join(resourceDir, parametersFileName);
    if (!parameters && fs_extra_1.default.existsSync(parametersFilePath)) {
        try {
            parameters = amplify_cli_core_1.JSONUtilities.readJson(parametersFilePath);
        }
        catch (e) {
            parameters = {};
        }
    }
    const isCLIMigration = options.migrate;
    const isOldApiVersion = apiProjectIsFromOldVersion(previouslyDeployedBackendDir, resourcesToBeCreated);
    const migrateOptions = {
        ...options,
        resourceDir,
        migrate: false,
        isCLIMigration,
        cloudBackendDirectory: previouslyDeployedBackendDir,
    };
    if (isCLIMigration && isOldApiVersion) {
        return await migrateProject(context, migrateOptions);
    }
    else if (isOldApiVersion) {
        let IsOldApiProject;
        if (context.exeInfo && context.exeInfo.inputParams && context.exeInfo.inputParams.yes) {
            IsOldApiProject = context.exeInfo.inputParams.yes;
        }
        else {
            const migrateMessage = `${chalk_1.default.bold('The CLI is going to take the following actions during the migration step:')}\n` +
                '\n1. If you have a GraphQL API, we will update the corresponding Cloudformation stack to support larger annotated schemas and custom resolvers.\n' +
                'In this process, we will be making Cloudformation API calls to update your GraphQL API Cloudformation stack. This operation will result in deletion of your AppSync resolvers and then the creation of new ones and for a brief while your AppSync API will be unavailable until the migration finishes\n' +
                '\n2. We will be updating your local Cloudformation files present inside the ‘amplify/‘ directory of your app project, for the GraphQL API service\n' +
                '\n3. If for any reason the migration fails, the CLI will rollback your cloud and local changes and you can take a look at https://aws-amplify.github.io/docs/cli/migrate?sdk=js for manually migrating your project so that it’s compatible with the latest version of the CLI\n' +
                '\n4. ALL THE ABOVE MENTIONED OPERATIONS WILL NOT DELETE ANY DATA FROM ANY OF YOUR DATA STORES\n' +
                `\n${chalk_1.default.bold('Before the migration, please be aware of the following things:')}\n` +
                '\n1. Make sure to have an internet connection through the migration process\n' +
                '\n2. Make sure to not exit/terminate the migration process (by interrupting it explicitly in the middle of migration), as this will lead to inconsistency within your project\n' +
                '\n3. Make sure to take a backup of your entire project (including the amplify related config files)\n' +
                '\nDo you want to continue?\n';
            ({ IsOldApiProject } = await inquirer_1.default.prompt({
                name: 'IsOldApiProject',
                type: 'confirm',
                message: migrateMessage,
                default: true,
            }));
        }
        if (!IsOldApiProject) {
            throw new Error('Migration cancelled. Please downgrade to a older version of the Amplify CLI or migrate your API project.');
        }
        return await migrateProject(context, migrateOptions);
    }
    let { authConfig } = options;
    if (!authConfig) {
        if (resources[0].output.securityType) {
            authConfig = {
                defaultAuthentication: {
                    authenticationType: resources[0].output.securityType,
                },
                additionalAuthenticationProviders: [],
            };
        }
        else {
            ({ authConfig } = resources[0].output);
        }
    }
    const s3ResourceName = await invokeS3GetResourceName(context);
    const storageConfig = {
        bucketName: s3ResourceName ? await getBucketName(context, s3ResourceName) : undefined,
    };
    const buildDir = path_1.default.normalize(path_1.default.join(resourceDir, 'build'));
    const schemaFilePath = path_1.default.normalize(path_1.default.join(resourceDir, schemaFileName));
    const schemaDirPath = path_1.default.normalize(path_1.default.join(resourceDir, schemaDirName));
    let deploymentRootKey = await getPreviousDeploymentRootKey(previouslyDeployedBackendDir);
    if (!deploymentRootKey) {
        const deploymentSubKey = await amplify_cli_core_1.CloudformationProviderFacade.hashDirectory(context, resourceDir);
        deploymentRootKey = `${ROOT_APPSYNC_S3_KEY}/${deploymentSubKey}`;
    }
    const projectBucket = options.dryRun ? 'fake-bucket' : getProjectBucket(context);
    const buildParameters = {
        ...parameters,
        S3DeploymentBucket: projectBucket,
        S3DeploymentRootKey: deploymentRootKey,
    };
    if (!options.dryRun) {
        fs_extra_1.default.ensureDirSync(buildDir);
    }
    const project = await (0, graphql_transformer_core_1.readProjectConfiguration)(resourceDir);
    const directiveMap = (0, graphql_transformer_core_1.collectDirectivesByTypeNames)(project.schema);
    await warnOnAuth(context, directiveMap.types);
    await (0, api_utils_1.searchablePushChecks)(context, directiveMap.types, parameters[graphql_transformer_common_1.ResourceConstants.PARAMETERS.AppSyncApiName]);
    await transformerVersionCheck(context, resourceDir, previouslyDeployedBackendDir, resourcesToBeUpdated, directiveMap.directives);
    const transformerListFactory = await (0, transformer_factory_1.getTransformerFactoryV1)(context, resourceDir, authConfig);
    let searchableTransformerFlag = false;
    if (directiveMap.directives.includes('searchable')) {
        searchableTransformerFlag = true;
    }
    const ff = new amplify_cli_feature_flag_adapter_1.AmplifyCLIFeatureFlagAdapter();
    const allowDestructiveUpdates = ((_b = (_a = context === null || context === void 0 ? void 0 : context.input) === null || _a === void 0 ? void 0 : _a.options) === null || _b === void 0 ? void 0 : _b[DESTRUCTIVE_UPDATES_FLAG]) || ((_d = (_c = context === null || context === void 0 ? void 0 : context.input) === null || _c === void 0 ? void 0 : _c.options) === null || _d === void 0 ? void 0 : _d.force);
    const sanityCheckRulesList = (0, graphql_transformer_core_1.getSanityCheckRules)(isNewAppSyncAPI, ff, allowDestructiveUpdates);
    const buildConfig = {
        ...options,
        buildParameters,
        projectDirectory: resourceDir,
        transformersFactory: transformerListFactory,
        transformersFactoryArgs: [searchableTransformerFlag, storageConfig],
        rootStackFileName: 'cloudformation-template.json',
        currentCloudBackendDirectory: previouslyDeployedBackendDir,
        featureFlags: ff,
        sanityCheckRules: sanityCheckRulesList,
    };
    const transformerOutput = await (0, graphql_transformer_core_1.buildAPIProject)(buildConfig);
    context.print.success(`GraphQL schema compiled successfully.\n\nEdit your schema at ${schemaFilePath} or \
place .graphql files in a directory at ${schemaDirPath}`);
    if ((0, auth_mode_compare_1.isAuthModeUpdated)(options)) {
        parameters.AuthModeLastUpdated = new Date();
    }
    if (!options.dryRun) {
        amplify_cli_core_1.JSONUtilities.writeJson(parametersFilePath, parameters);
    }
    return transformerOutput;
}
exports.transformGraphQLSchemaV1 = transformGraphQLSchemaV1;
function getProjectBucket(context) {
    const projectDetails = context.amplify.getProjectDetails();
    const projectBucket = projectDetails.amplifyMeta.providers
        ? projectDetails.amplifyMeta.providers[PROVIDER_NAME].DeploymentBucketName
        : '';
    return projectBucket;
}
async function getPreviousDeploymentRootKey(previouslyDeployedBackendDir) {
    let parameters;
    try {
        const parametersPath = path_1.default.join(previouslyDeployedBackendDir, 'build', parametersFileName);
        const parametersExists = fs_extra_1.default.existsSync(parametersPath);
        if (parametersExists) {
            const parametersString = await fs_extra_1.default.readFile(parametersPath);
            parameters = JSON.parse(parametersString.toString());
        }
        return parameters.S3DeploymentRootKey;
    }
    catch (err) {
        return undefined;
    }
}
async function invokeS3GetResourceName(context) {
    const s3ResourceName = await context.amplify.invokePluginMethod(context, 'storage', undefined, 's3GetResourceName', [context]);
    return s3ResourceName;
}
async function getBucketName(context, s3ResourceName) {
    const { amplify } = context;
    const { amplifyMeta } = amplify.getProjectDetails();
    const stackName = amplifyMeta.providers.awscloudformation.StackName;
    const s3ResourcePath = amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, amplify_cli_core_1.AmplifyCategories.STORAGE, s3ResourceName);
    const cliInputsPath = path_1.default.join(s3ResourcePath, 'cli-inputs.json');
    let bucketParameters;
    if (fs_extra_1.default.existsSync(cliInputsPath)) {
        bucketParameters = amplify_cli_core_1.JSONUtilities.readJson(cliInputsPath);
    }
    else {
        bucketParameters = amplify_cli_core_1.stateManager.getResourceParametersJson(undefined, amplify_cli_core_1.AmplifyCategories.STORAGE, s3ResourceName);
    }
    const bucketName = stackName.startsWith('amplify-')
        ? `${bucketParameters.bucketName}\${hash}-\${env}`
        : `${bucketParameters.bucketName}${s3ResourceName}-\${env}`;
    return bucketName;
}
//# sourceMappingURL=transform-graphql-schema-v1.js.map