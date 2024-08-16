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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformCategoryStack = exports.addGraphQLAuthorizationMode = exports.handleAmplifyEvent = exports.executeAmplifyHeadlessCommand = exports.executeAmplifyCommand = exports.getPermissionPolicies = exports.initEnv = exports.migrate = exports.console = exports.isDataStoreEnabled = exports.showApiAuthAcm = exports.getGitHubOwnerRepoFromPath = exports.getResolverConfig = exports.getAuthConfig = exports.processDockerConfig = exports.generateContainersArtifacts = exports.promptToAddApiKey = exports.EcsStack = exports.EcsAlbStack = exports.getContainers = exports.convertDeperecatedRestApiPaths = exports.DEPLOYMENT_MECHANISM = exports.updateAdminQueriesApi = exports.addAdminQueriesApi = exports.NETWORK_STACK_LOGICAL_ID = void 0;
const path = __importStar(require("path"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_environment_parameters_1 = require("@aws-amplify/amplify-environment-parameters");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const amplify_util_headless_input_1 = require("amplify-util-headless-input");
const fs = __importStar(require("fs-extra"));
const graphql_transformer_core_1 = require("@aws-amplify/graphql-transformer-core");
const lodash_1 = __importDefault(require("lodash"));
const console_1 = require("./commands/api/console");
const amplify_meta_utils_1 = require("./provider-utils/awscloudformation/utils/amplify-meta-utils");
const aws_constants_1 = require("./provider-utils/awscloudformation/aws-constants");
const cdk_stack_builder_1 = require("./provider-utils/awscloudformation/cdk-stack-builder");
const cfn_api_artifact_handler_1 = require("./provider-utils/awscloudformation/cfn-api-artifact-handler");
const appSync_walkthrough_1 = require("./provider-utils/awscloudformation/service-walkthroughs/appSync-walkthrough");
const auth_config_to_app_sync_auth_type_bi_di_mapper_1 = require("./provider-utils/awscloudformation/utils/auth-config-to-app-sync-auth-type-bi-di-mapper");
const check_appsync_api_migration_1 = require("./provider-utils/awscloudformation/utils/check-appsync-api-migration");
const getAppSyncApiName_1 = require("./provider-utils/awscloudformation/utils/getAppSyncApiName");
const multi_env_database_secrets_1 = require("./provider-utils/awscloudformation/utils/rds-resources/multi-env-database-secrets");
const database_resources_1 = require("./provider-utils/awscloudformation/utils/rds-resources/database-resources");
const amplify_error_converter_1 = require("./errors/amplify-error-converter");
var category_constants_1 = require("./category-constants");
Object.defineProperty(exports, "NETWORK_STACK_LOGICAL_ID", { enumerable: true, get: function () { return category_constants_1.NETWORK_STACK_LOGICAL_ID; } });
var awscloudformation_1 = require("./provider-utils/awscloudformation");
Object.defineProperty(exports, "addAdminQueriesApi", { enumerable: true, get: function () { return awscloudformation_1.addAdminQueriesApi; } });
Object.defineProperty(exports, "updateAdminQueriesApi", { enumerable: true, get: function () { return awscloudformation_1.updateAdminQueriesApi; } });
var base_api_stack_1 = require("./provider-utils/awscloudformation/base-api-stack");
Object.defineProperty(exports, "DEPLOYMENT_MECHANISM", { enumerable: true, get: function () { return base_api_stack_1.DEPLOYMENT_MECHANISM; } });
var convert_deprecated_apigw_paths_1 = require("./provider-utils/awscloudformation/convert-deprecated-apigw-paths");
Object.defineProperty(exports, "convertDeperecatedRestApiPaths", { enumerable: true, get: function () { return convert_deprecated_apigw_paths_1.convertDeperecatedRestApiPaths; } });
var docker_compose_1 = require("./provider-utils/awscloudformation/docker-compose");
Object.defineProperty(exports, "getContainers", { enumerable: true, get: function () { return docker_compose_1.getContainers; } });
var ecs_alb_stack_1 = require("./provider-utils/awscloudformation/ecs-alb-stack");
Object.defineProperty(exports, "EcsAlbStack", { enumerable: true, get: function () { return ecs_alb_stack_1.EcsAlbStack; } });
var ecs_apigw_stack_1 = require("./provider-utils/awscloudformation/ecs-apigw-stack");
Object.defineProperty(exports, "EcsStack", { enumerable: true, get: function () { return ecs_apigw_stack_1.EcsStack; } });
var prompt_to_add_api_key_1 = require("./provider-utils/awscloudformation/prompt-to-add-api-key");
Object.defineProperty(exports, "promptToAddApiKey", { enumerable: true, get: function () { return prompt_to_add_api_key_1.promptToAddApiKey; } });
var containers_artifacts_1 = require("./provider-utils/awscloudformation/utils/containers-artifacts");
Object.defineProperty(exports, "generateContainersArtifacts", { enumerable: true, get: function () { return containers_artifacts_1.generateContainersArtifacts; } });
Object.defineProperty(exports, "processDockerConfig", { enumerable: true, get: function () { return containers_artifacts_1.processDockerConfig; } });
var get_appsync_auth_config_1 = require("./provider-utils/awscloudformation/utils/get-appsync-auth-config");
Object.defineProperty(exports, "getAuthConfig", { enumerable: true, get: function () { return get_appsync_auth_config_1.getAuthConfig; } });
var get_appsync_resolver_config_1 = require("./provider-utils/awscloudformation/utils/get-appsync-resolver-config");
Object.defineProperty(exports, "getResolverConfig", { enumerable: true, get: function () { return get_appsync_resolver_config_1.getResolverConfig; } });
var github_1 = require("./provider-utils/awscloudformation/utils/github");
Object.defineProperty(exports, "getGitHubOwnerRepoFromPath", { enumerable: true, get: function () { return github_1.getGitHubOwnerRepoFromPath; } });
__exportStar(require("./graphql-transformer"), exports);
__exportStar(require("./force-updates"), exports);
var show_auth_acm_1 = require("./category-utils/show-auth-acm");
Object.defineProperty(exports, "showApiAuthAcm", { enumerable: true, get: function () { return show_auth_acm_1.showApiAuthAcm; } });
var is_datastore_enabled_1 = require("./category-utils/is-datastore-enabled");
Object.defineProperty(exports, "isDataStoreEnabled", { enumerable: true, get: function () { return is_datastore_enabled_1.isDataStoreEnabled; } });
const category = amplify_cli_core_1.AmplifyCategories.API;
const console = async (context) => {
    await (0, console_1.run)(context);
};
exports.console = console;
const migrate = async (context, serviceName) => {
    var _a;
    var _b;
    const { projectPath } = (_b = context === null || context === void 0 ? void 0 : context.migrationInfo) !== null && _b !== void 0 ? _b : { projectPath: amplify_cli_core_1.pathManager.findProjectRoot() };
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta(projectPath);
    const migrateResourcePromises = [];
    for (const categoryName of Object.keys(amplifyMeta)) {
        if (categoryName !== category) {
            continue;
        }
        for (const resourceName of Object.keys(amplifyMeta[category])) {
            try {
                if (amplifyMeta[category][resourceName].providerPlugin) {
                    const providerController = await (_a = path.join(__dirname, 'provider-utils', amplifyMeta[category][resourceName].providerPlugin, 'index'), Promise.resolve().then(() => __importStar(require(_a))));
                    if (!providerController) {
                        continue;
                    }
                    if (!serviceName || serviceName === amplifyMeta[category][resourceName].service) {
                        migrateResourcePromises.push(providerController.migrateResource(context, projectPath, amplifyMeta[category][resourceName].service, resourceName));
                    }
                }
                else {
                    amplify_prompts_1.printer.error(`Provider not configured for ${category}: ${resourceName}`);
                }
            }
            catch (e) {
                amplify_prompts_1.printer.warn(`Could not run migration for ${category}: ${resourceName}`);
                throw e;
            }
        }
    }
    for (const migrateResourcePromise of migrateResourcePromises) {
        await migrateResourcePromise;
    }
};
exports.migrate = migrate;
const initEnv = async (context) => {
    var _a;
    var _b, _c;
    const datasource = 'Aurora Serverless';
    const service = 'service';
    const rdsInit = 'rdsInit';
    const { amplify } = context;
    const { envName } = amplify.getEnvInfo();
    const backendConfigFilePath = amplify_cli_core_1.pathManager.getBackendConfigFilePath();
    if (!fs.existsSync(backendConfigFilePath)) {
        return;
    }
    const backendConfig = amplify_cli_core_1.stateManager.getBackendConfig();
    if (!backendConfig[category]) {
        return;
    }
    let resourceName;
    const apis = Object.keys(backendConfig[category]);
    for (const api of apis) {
        if (backendConfig[category][api][service] === amplify_cli_core_1.AmplifySupportedService.APPSYNC) {
            resourceName = api;
            break;
        }
    }
    if (!resourceName) {
        return;
    }
    const apiResourceDir = (0, amplify_meta_utils_1.getAPIResourceDir)(resourceName);
    const pathToSchemaFile = path.join(apiResourceDir, graphql_transformer_core_1.SQL_SCHEMA_FILE_NAME);
    if (fs.existsSync(pathToSchemaFile)) {
        const secretsKey = await (0, database_resources_1.getSecretsKey)();
        const envInfo = {
            isNewEnv: (_b = context.exeInfo) === null || _b === void 0 ? void 0 : _b.isNewEnv,
            sourceEnv: (_c = context.exeInfo) === null || _c === void 0 ? void 0 : _c.sourceEnvName,
            yesFlagSet: lodash_1.default.get(context, ['parameters', 'options', 'yes'], false),
            envName: envName,
        };
        await (0, multi_env_database_secrets_1.configureMultiEnvDBSecrets)(context, secretsKey, resourceName, envInfo);
    }
    if (!backendConfig[category][resourceName][rdsInit]) {
        return;
    }
    const providerController = await (_a = path.join(__dirname, 'provider-utils', aws_constants_1.provider, 'index'), Promise.resolve().then(() => __importStar(require(_a))));
    if (!providerController) {
        amplify_prompts_1.printer.error('Provider not configured for this category');
        return;
    }
    const envParamManager = (await (0, amplify_environment_parameters_1.ensureEnvParamManager)()).instance;
    if (envParamManager.hasResourceParamManager(category, resourceName) &&
        envParamManager.getResourceParamManager(category, resourceName).getParam('rdsRegion')) {
        return;
    }
    await providerController
        .addDatasource(context, category, datasource)
        .then((answers) => {
        envParamManager.getResourceParamManager(category, resourceName).setParams({
            rdsRegion: answers.region,
            rdsClusterIdentifier: answers.dbClusterArn,
            rdsSecretStoreArn: answers.secretStoreArn,
            rdsDatabaseName: answers.databaseName,
        });
    })
        .then(async () => {
        await context.amplify.executeProviderUtils(context, 'awscloudformation', 'compileSchema', { forceCompile: true });
    });
};
exports.initEnv = initEnv;
const getPermissionPolicies = async (context, resourceOpsMapping) => {
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    const permissionPolicies = [];
    const resourceAttributes = [];
    await Promise.all(Object.keys(resourceOpsMapping).map(async (resourceName) => {
        var _a;
        try {
            const providerName = amplifyMeta[category][resourceName].providerPlugin;
            if (providerName) {
                const providerController = await (_a = path.join(__dirname, 'provider-utils', providerName, 'index'), Promise.resolve().then(() => __importStar(require(_a))));
                const { policy, attributes } = await providerController.getPermissionPolicies(context, amplifyMeta[category][resourceName].service, resourceName, resourceOpsMapping[resourceName]);
                permissionPolicies.push(policy);
                resourceAttributes.push({ resourceName, attributes, category });
            }
            else {
                amplify_prompts_1.printer.error(`Provider not configured for ${category}: ${resourceName}`);
            }
        }
        catch (e) {
            amplify_prompts_1.printer.warn(`Could not get policies for ${category}: ${resourceName}`);
            throw e;
        }
    }));
    return { permissionPolicies, resourceAttributes };
};
exports.getPermissionPolicies = getPermissionPolicies;
const executeAmplifyCommand = async (context) => {
    var _a;
    let commandPath = path.normalize(path.join(__dirname, 'commands'));
    if (context.input.command === 'help') {
        commandPath = path.join(commandPath, category);
    }
    else {
        commandPath = path.join(commandPath, category, context.input.command);
    }
    disableCDKDeprecationWarning();
    const commandModule = await (_a = commandPath, Promise.resolve().then(() => __importStar(require(_a))));
    try {
        await commandModule.run(context);
    }
    catch (error) {
        if (error) {
            amplify_prompts_1.printer.error(error.message || error);
            if (error.stack) {
                amplify_prompts_1.printer.debug(error.stack);
            }
            await context.usageData.emitError(error);
        }
        process.exitCode = 1;
    }
};
exports.executeAmplifyCommand = executeAmplifyCommand;
const executeAmplifyHeadlessCommand = async (context, headlessPayload) => {
    context.usageData.pushHeadlessFlow(headlessPayload, context.input);
    switch (context.input.command) {
        case 'add':
            await (0, cfn_api_artifact_handler_1.getCfnApiArtifactHandler)(context).createArtifacts(await (0, amplify_util_headless_input_1.validateAddApiRequest)(headlessPayload));
            break;
        case 'update': {
            const resourceName = await (0, getAppSyncApiName_1.getAppSyncApiResourceName)(context);
            await (0, check_appsync_api_migration_1.checkAppsyncApiResourceMigration)(context, resourceName, true);
            await (0, cfn_api_artifact_handler_1.getCfnApiArtifactHandler)(context).updateArtifacts(await (0, amplify_util_headless_input_1.validateUpdateApiRequest)(headlessPayload));
            break;
        }
        default:
            amplify_prompts_1.printer.error(`Headless mode for ${context.input.command} api is not implemented yet`);
    }
};
exports.executeAmplifyHeadlessCommand = executeAmplifyHeadlessCommand;
const handleAmplifyEvent = async (context, args) => {
    var _a;
    switch (args.event) {
        case 'InternalOnlyPostEnvRemove': {
            const meta = amplify_cli_core_1.stateManager.getMeta();
            const apiName = (0, amplify_meta_utils_1.getAppSyncResourceName)(meta);
            if (!apiName) {
                return;
            }
            await (0, database_resources_1.deleteConnectionSecrets)(context, apiName, (_a = args === null || args === void 0 ? void 0 : args.data) === null || _a === void 0 ? void 0 : _a.envName);
            await (0, database_resources_1.removeVpcSchemaInspectorLambda)(context);
            break;
        }
        default:
    }
};
exports.handleAmplifyEvent = handleAmplifyEvent;
const addGraphQLAuthorizationMode = async (context, args) => {
    const { authType, printLeadText, authSettings } = args;
    const meta = amplify_cli_core_1.stateManager.getMeta();
    const apiName = (0, amplify_meta_utils_1.getAppSyncResourceName)(meta);
    if (!apiName) {
        return undefined;
    }
    const authConfig = (0, amplify_meta_utils_1.getAppSyncAuthConfig)(meta);
    const addAuthConfig = await (0, appSync_walkthrough_1.askAuthQuestions)(authType, context, printLeadText, authSettings);
    authConfig.additionalAuthenticationProviders.push(addAuthConfig);
    await context.amplify.updateamplifyMetaAfterResourceUpdate(category, apiName, 'output', { authConfig });
    await context.amplify.updateBackendConfigAfterResourceUpdate(category, apiName, 'output', { authConfig });
    await (0, cfn_api_artifact_handler_1.getCfnApiArtifactHandler)(context).updateArtifacts({
        version: 1,
        serviceModification: {
            serviceName: 'AppSync',
            additionalAuthTypes: authConfig.additionalAuthenticationProviders.map(auth_config_to_app_sync_auth_type_bi_di_mapper_1.authConfigToAppSyncAuthType),
        },
    }, {
        skipCompile: false,
    });
    return addAuthConfig;
};
exports.addGraphQLAuthorizationMode = addGraphQLAuthorizationMode;
const transformCategoryStack = async (context, resource) => {
    if (resource.service === amplify_cli_core_1.AmplifySupportedService.APPSYNC) {
        if (canResourceBeTransformed(resource.resourceName)) {
            const backendDir = amplify_cli_core_1.pathManager.getBackendDirPath();
            const overrideDir = path.join(backendDir, resource.category, resource.resourceName);
            const isBuild = await (0, amplify_cli_core_1.buildOverrideDir)(backendDir, overrideDir).catch((error) => {
                throw new amplify_cli_core_1.AmplifyError('InvalidOverrideError', {
                    message: error.message,
                    link: 'https://docs.amplify.aws/cli/graphql/override/',
                });
            });
            try {
                await context.amplify.invokePluginMethod(context, 'awscloudformation', undefined, 'compileSchema', [
                    context,
                    {
                        forceCompile: true,
                        overrideConfig: {
                            overrideFlag: isBuild,
                            overrideDir,
                            resourceName: resource.resourceName,
                        },
                    },
                ]);
            }
            catch (error) {
                throw amplify_error_converter_1.AmplifyGraphQLTransformerErrorConverter.convert(error);
            }
        }
    }
    else if (resource.service === amplify_cli_core_1.AmplifySupportedService.APIGW) {
        if (canResourceBeTransformed(resource.resourceName)) {
            const apigwStack = new cdk_stack_builder_1.ApigwStackTransform(context, resource.resourceName);
            await apigwStack.transform();
        }
    }
};
exports.transformCategoryStack = transformCategoryStack;
const canResourceBeTransformed = (resourceName) => amplify_cli_core_1.stateManager.resourceInputsJsonExists(undefined, amplify_cli_core_1.AmplifyCategories.API, resourceName);
const disableCDKDeprecationWarning = () => {
    const isDebug = process.argv.includes('--debug') || process.env.AMPLIFY_ENABLE_DEBUG_OUTPUT === 'true';
    if (!isDebug) {
        process.env.JSII_DEPRECATED = 'quiet';
    }
};
//# sourceMappingURL=index.js.map