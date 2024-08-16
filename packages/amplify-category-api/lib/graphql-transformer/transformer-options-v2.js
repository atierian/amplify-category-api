"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadCustomTransformersV2 = exports.suppressApiKeyGeneration = exports.generateTransformerOptions = exports.APPSYNC_RESOURCE_SERVICE = void 0;
const path_1 = __importDefault(require("path"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const graphql_transformer_core_1 = require("@aws-amplify/graphql-transformer-core");
const graphql_transformer_core_2 = require("graphql-transformer-core");
const fs_extra_1 = __importDefault(require("fs-extra"));
const graphql_transformer_common_1 = require("graphql-transformer-common");
const lodash_1 = __importDefault(require("lodash"));
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const context_util_1 = require("../category-utils/context-util");
const searchable_node_to_node_encryption_1 = require("../provider-utils/awscloudformation/current-backend-state/searchable-node-to-node-encryption");
const sandbox_mode_helpers_1 = require("./sandbox-mode-helpers");
const transformer_factory_1 = require("./transformer-factory");
const amplify_cli_feature_flag_adapter_1 = require("./amplify-cli-feature-flag-adapter");
const constants_1 = require("./constants");
const api_utils_1 = require("./api-utils");
const user_defined_slots_1 = require("./user-defined-slots");
const override_1 = require("./override");
exports.APPSYNC_RESOURCE_SERVICE = 'AppSync';
const warnOnAuth = (map, docLink) => {
    const unAuthModelTypes = Object.keys(map).filter((type) => !map[type].includes('auth') && map[type].includes('model'));
    if (unAuthModelTypes.length) {
        amplify_prompts_1.printer.info(`
⚠️  WARNING: Some types do not have authorization rules configured. That means all create, read, update, and delete operations are denied on these types:`, 'yellow');
        amplify_prompts_1.printer.info(unAuthModelTypes.map((type) => `\t - ${type}`).join('\n'), 'yellow');
        amplify_prompts_1.printer.info(`Learn more about "@auth" authorization rules here: ${docLink}`, 'yellow');
    }
};
const generateTransformerOptions = async (context, options) => {
    var _a, _b, _c, _d;
    let resourceName;
    const backEndDir = amplify_cli_core_1.pathManager.getBackendDirPath();
    const flags = context.parameters.options;
    if (flags['no-gql-override']) {
        return undefined;
    }
    let { parameters } = options;
    const { forceCompile } = options;
    const { resourcesToBeCreated, resourcesToBeUpdated, allResources } = await context.amplify.getResourceStatus(amplify_cli_core_1.AmplifyCategories.API);
    let resources = resourcesToBeCreated.concat(resourcesToBeUpdated);
    const resourceNeedCompile = allResources
        .filter((r) => !resources.includes(r))
        .filter((r) => {
        const buildDir = path_1.default.normalize(path_1.default.join(backEndDir, amplify_cli_core_1.AmplifyCategories.API, r.resourceName, 'build'));
        return !fs_extra_1.default.existsSync(buildDir);
    });
    resources = resources.concat(resourceNeedCompile);
    if (forceCompile) {
        resources = resources.concat(allResources);
    }
    resources = resources.filter((resource) => resource.service === exports.APPSYNC_RESOURCE_SERVICE);
    const resourceDir = await context_util_1.contextUtil.getResourceDir(context, options);
    let previouslyDeployedBackendDir = options.cloudBackendDirectory;
    if (!previouslyDeployedBackendDir) {
        if (resources.length > 0) {
            const resource = resources[0];
            if (resource.providerPlugin !== constants_1.PROVIDER_NAME) {
                return undefined;
            }
            const { category } = resource;
            resourceName = resource.resourceName;
            const cloudBackendRootDir = amplify_cli_core_1.pathManager.getCurrentCloudBackendDirPath();
            previouslyDeployedBackendDir = path_1.default.normalize(path_1.default.join(cloudBackendRootDir, category, resourceName));
        }
    }
    const parametersFilePath = path_1.default.join(resourceDir, constants_1.PARAMETERS_FILENAME);
    if (!parameters && fs_extra_1.default.existsSync(parametersFilePath)) {
        try {
            parameters = amplify_cli_core_1.JSONUtilities.readJson(parametersFilePath);
            if (parameters[graphql_transformer_common_1.ResourceConstants.PARAMETERS.OpenSearchInstanceType]) {
                parameters[graphql_transformer_common_1.ResourceConstants.PARAMETERS.OpenSearchInstanceType] = parameters[graphql_transformer_common_1.ResourceConstants.PARAMETERS.OpenSearchInstanceType].replace('.search', '.elasticsearch');
            }
        }
        catch (e) {
            parameters = {};
        }
    }
    let { authConfig } = options;
    if (lodash_1.default.isEmpty(authConfig) && !lodash_1.default.isEmpty(resources)) {
        authConfig = await context.amplify.invokePluginMethod(context, amplify_cli_core_1.AmplifyCategories.API, amplify_cli_core_1.AmplifySupportedService.APPSYNC, 'getAuthConfig', [context, resources[0].resourceName]);
        if (lodash_1.default.isEmpty(authConfig)) {
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
    }
    const s3Resource = s3ResourceAlreadyExists();
    const storageConfig = s3Resource ? getBucketName(s3Resource) : undefined;
    let deploymentRootKey = await getPreviousDeploymentRootKey(previouslyDeployedBackendDir);
    if (!deploymentRootKey) {
        const deploymentSubKey = await amplify_cli_core_1.CloudformationProviderFacade.hashDirectory(context, resourceDir);
        deploymentRootKey = `${constants_1.ROOT_APPSYNC_S3_KEY}/${deploymentSubKey}`;
    }
    const projectBucket = options.dryRun ? 'fake-bucket' : getProjectBucket();
    const buildParameters = {
        ...parameters,
        S3DeploymentBucket: projectBucket,
        S3DeploymentRootKey: deploymentRootKey,
    };
    const project = await (0, graphql_transformer_core_2.loadProject)(resourceDir);
    const lastDeployedProjectConfig = fs_extra_1.default.existsSync(previouslyDeployedBackendDir)
        ? await (0, graphql_transformer_core_2.loadProject)(previouslyDeployedBackendDir)
        : undefined;
    const docLink = (0, amplify_cli_core_1.getGraphQLTransformerAuthDocLink)(2);
    const sandboxModeEnabled = (0, sandbox_mode_helpers_1.schemaHasSandboxModeEnabled)(project.schema, docLink);
    const directiveMap = (0, graphql_transformer_core_1.collectDirectivesByTypeNames)(project.schema);
    const hasApiKey = authConfig.defaultAuthentication.authenticationType === 'API_KEY' ||
        authConfig.additionalAuthenticationProviders.some((authProvider) => authProvider.authenticationType === 'API_KEY');
    const showSandboxModeMessage = sandboxModeEnabled && hasApiKey;
    await (0, api_utils_1.searchablePushChecks)(context, directiveMap.types, parameters[graphql_transformer_common_1.ResourceConstants.PARAMETERS.AppSyncApiName]);
    if (sandboxModeEnabled && options.promptApiKeyCreation) {
        const apiKeyConfig = await (0, sandbox_mode_helpers_1.showSandboxModePrompts)(context);
        if (apiKeyConfig)
            authConfig.additionalAuthenticationProviders.push(apiKeyConfig);
    }
    if (showSandboxModeMessage) {
        (0, sandbox_mode_helpers_1.showGlobalSandboxModeWarning)(docLink);
    }
    else {
        warnOnAuth(directiveMap.types, docLink);
    }
    const ff = new amplify_cli_feature_flag_adapter_1.AmplifyCLIFeatureFlagAdapter();
    const isNewAppSyncAPI = resourcesToBeCreated.some((resource) => resource.service === 'AppSync');
    const allowDestructiveUpdates = ((_b = (_a = context === null || context === void 0 ? void 0 : context.input) === null || _a === void 0 ? void 0 : _a.options) === null || _b === void 0 ? void 0 : _b[constants_1.DESTRUCTIVE_UPDATES_FLAG]) || ((_d = (_c = context === null || context === void 0 ? void 0 : context.input) === null || _c === void 0 ? void 0 : _c.options) === null || _d === void 0 ? void 0 : _d.force);
    const sanityCheckRules = (0, graphql_transformer_core_2.getSanityCheckRules)(isNewAppSyncAPI, ff, allowDestructiveUpdates);
    let resolverConfig = {};
    if (!lodash_1.default.isEmpty(resources)) {
        resolverConfig = await context.amplify.invokePluginMethod(context, amplify_cli_core_1.AmplifyCategories.API, amplify_cli_core_1.AmplifySupportedService.APPSYNC, 'getResolverConfig', [context, resources[0].resourceName]);
    }
    if (lodash_1.default.isEmpty(resolverConfig)) {
        resolverConfig = project.config.ResolverConfig;
    }
    const resourceDirParts = resourceDir.split(path_1.default.sep);
    const apiName = resourceDirParts[resourceDirParts.length - 1];
    const userDefinedSlots = {
        ...(0, user_defined_slots_1.parseUserDefinedSlots)(project.pipelineFunctions),
        ...(0, user_defined_slots_1.parseUserDefinedSlots)(project.resolvers),
    };
    const overrideConfig = {
        applyOverride: (scope) => (0, override_1.applyFileBasedOverride)(scope),
        ...options.overrideConfig,
    };
    return {
        ...options,
        resourceName,
        buildParameters,
        projectDirectory: resourceDir,
        transformersFactoryArgs: {
            storageConfig,
            customTransformers: await (0, exports.loadCustomTransformersV2)(resourceDir),
        },
        rootStackFileName: 'cloudformation-template.json',
        currentCloudBackendDirectory: previouslyDeployedBackendDir,
        projectConfig: project,
        lastDeployedProjectConfig,
        authConfig,
        sandboxModeEnabled,
        sanityCheckRules,
        resolverConfig,
        userDefinedSlots,
        overrideConfig,
        stacks: project.stacks,
        stackMapping: project.config.StackMapping,
        transformParameters: generateTransformParameters(apiName, parameters, project.config, sandboxModeEnabled),
    };
};
exports.generateTransformerOptions = generateTransformerOptions;
const generateTransformParameters = (apiName, parameters, projectConfig, sandboxModeEnabled) => {
    var _a;
    const featureFlagProvider = new amplify_cli_feature_flag_adapter_1.AmplifyCLIFeatureFlagAdapter();
    return {
        shouldDeepMergeDirectiveConfigDefaults: featureFlagProvider.getBoolean('shouldDeepMergeDirectiveConfigDefaults'),
        useSubUsernameForDefaultIdentityClaim: featureFlagProvider.getBoolean('useSubUsernameForDefaultIdentityClaim'),
        populateOwnerFieldForStaticGroupAuth: featureFlagProvider.getBoolean('populateOwnerFieldForStaticGroupAuth'),
        secondaryKeyAsGSI: featureFlagProvider.getBoolean('secondaryKeyAsGSI'),
        enableAutoIndexQueryNames: featureFlagProvider.getBoolean('enableAutoIndexQueryNames'),
        respectPrimaryKeyAttributesOnConnectionField: featureFlagProvider.getBoolean('respectPrimaryKeyAttributesOnConnectionField'),
        subscriptionsInheritPrimaryAuth: featureFlagProvider.getBoolean('subscriptionsInheritPrimaryAuth'),
        suppressApiKeyGeneration: (0, exports.suppressApiKeyGeneration)(parameters),
        disableResolverDeduping: (_a = projectConfig.DisableResolverDeduping) !== null && _a !== void 0 ? _a : false,
        enableSearchNodeToNodeEncryption: (0, searchable_node_to_node_encryption_1.shouldEnableNodeToNodeEncryption)(apiName, amplify_cli_core_1.pathManager.findProjectRoot(), amplify_cli_core_1.pathManager.getCurrentCloudBackendDirPath()),
        sandboxModeEnabled,
        enableTransformerCfnOutputs: true,
        allowDestructiveGraphqlSchemaUpdates: false,
        replaceTableUponGsiUpdate: false,
        allowGen1Patterns: true,
    };
};
const suppressApiKeyGeneration = (parameters) => {
    if (!('CreateAPIKey' in parameters)) {
        return false;
    }
    return parameters.CreateAPIKey !== 1 && parameters.CreateAPIKey !== '1';
};
exports.suppressApiKeyGeneration = suppressApiKeyGeneration;
const loadCustomTransformersV2 = async (resourceDir) => {
    var _a;
    const customTransformersConfig = await (0, graphql_transformer_core_2.loadProject)(resourceDir);
    const customTransformerList = (_a = customTransformersConfig === null || customTransformersConfig === void 0 ? void 0 : customTransformersConfig.config) === null || _a === void 0 ? void 0 : _a.transformers;
    return (Array.isArray(customTransformerList) ? customTransformerList : [])
        .map(transformer_factory_1.importTransformerModule)
        .map((imported) => {
        const CustomTransformer = imported.default;
        if (typeof CustomTransformer === 'function') {
            return new CustomTransformer();
        }
        if (typeof CustomTransformer === 'object') {
            throw new Error("Custom Transformers' should implement TransformerProvider interface");
        }
        throw new Error("Custom Transformers' default export must be a function or an object");
    })
        .filter((customTransformer) => customTransformer);
};
exports.loadCustomTransformersV2 = loadCustomTransformersV2;
const getBucketName = (s3ResourceName) => {
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
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
    return { bucketName };
};
const getPreviousDeploymentRootKey = async (previouslyDeployedBackendDir) => {
    let parameters;
    try {
        const parametersPath = path_1.default.join(previouslyDeployedBackendDir, `build/${constants_1.PARAMETERS_FILENAME}`);
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
};
const getProjectBucket = () => {
    const meta = amplify_cli_core_1.stateManager.getMeta(undefined, { throwIfNotExist: false });
    const projectBucket = (meta === null || meta === void 0 ? void 0 : meta.providers) ? meta.providers[constants_1.PROVIDER_NAME].DeploymentBucketName : '';
    return projectBucket;
};
const s3ResourceAlreadyExists = () => {
    try {
        let resourceName;
        const amplifyMeta = amplify_cli_core_1.stateManager.getMeta(undefined, { throwIfNotExist: false });
        if (amplifyMeta === null || amplifyMeta === void 0 ? void 0 : amplifyMeta[amplify_cli_core_1.AmplifyCategories.STORAGE]) {
            const categoryResources = amplifyMeta[amplify_cli_core_1.AmplifyCategories.STORAGE];
            Object.keys(categoryResources).forEach((resource) => {
                if (categoryResources[resource].service === amplify_cli_core_1.AmplifySupportedService.S3) {
                    resourceName = resource;
                }
            });
        }
        return resourceName;
    }
    catch (error) {
        if (error.name === 'UndeterminedEnvironmentError') {
            return undefined;
        }
        throw error;
    }
};
//# sourceMappingURL=transformer-options-v2.js.map