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
exports.getUserOverridenSlots = exports.transformGraphQLSchemaV2 = void 0;
const path_1 = __importDefault(require("path"));
const graphql_transformer_core_1 = require("@aws-amplify/graphql-transformer-core");
const graphql_transformer_interfaces_1 = require("@aws-amplify/graphql-transformer-interfaces");
const fs = __importStar(require("fs-extra"));
const graphql_transformer_common_1 = require("graphql-transformer-common");
const graphql_transformer_core_2 = require("graphql-transformer-core");
const lodash_1 = __importDefault(require("lodash"));
const graphql_transformer_1 = require("@aws-amplify/graphql-transformer");
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const graphql_schema_generator_1 = require("@aws-amplify/graphql-schema-generator");
const node_fetch_1 = __importDefault(require("node-fetch"));
const database_resources_1 = require("../provider-utils/awscloudformation/utils/rds-resources/database-resources");
const amplify_meta_utils_1 = require("../provider-utils/awscloudformation/utils/amplify-meta-utils");
const utils_1 = require("../provider-utils/awscloudformation/utils/rds-resources/utils");
const auth_mode_compare_1 = require("./auth-mode-compare");
const utils_2 = require("./utils");
const transformer_options_v2_1 = require("./transformer-options-v2");
const transform_manager_1 = require("./cdk-compat/transform-manager");
const PARAMETERS_FILENAME = 'parameters.json';
const SCHEMA_FILENAME = 'schema.graphql';
const SCHEMA_DIR_NAME = 'schema';
const PROVIDER_NAME = 'awscloudformation';
const USE_BETA_SQL_LAYER = 'use-beta-sql-layer';
const transformGraphQLSchemaV2 = async (context, options) => {
    let resourceName;
    const backEndDir = amplify_cli_core_1.pathManager.getBackendDirPath();
    const flags = context.parameters.options;
    if (flags['no-gql-override']) {
        return undefined;
    }
    let { resourceDir, parameters } = options;
    const { forceCompile } = options;
    const { resourcesToBeCreated, resourcesToBeUpdated, allResources } = await context.amplify.getResourceStatus(amplify_cli_core_1.AmplifyCategories.API);
    let resources = resourcesToBeCreated.concat(resourcesToBeUpdated);
    const resourceNeedCompile = allResources
        .filter((r) => !resources.includes(r))
        .filter((r) => {
        const buildDir = path_1.default.normalize(path_1.default.join(backEndDir, amplify_cli_core_1.AmplifyCategories.API, r.resourceName, 'build'));
        return !fs.pathExistsSync(buildDir);
    });
    resources = resources.concat(resourceNeedCompile);
    if (forceCompile) {
        resources = resources.concat(allResources);
    }
    resources = resources.filter((resource) => resource.service === 'AppSync');
    if (!resourceDir) {
        if (resources.length > 0) {
            const resource = resources[0];
            if (resource.providerPlugin !== PROVIDER_NAME) {
                return undefined;
            }
            const { category } = resource;
            ({ resourceName } = resource);
            resourceDir = path_1.default.normalize(path_1.default.join(backEndDir, category, resourceName));
        }
        else {
            return undefined;
        }
    }
    const previouslyDeployedBackendDir = options.cloudBackendDirectory;
    if (!previouslyDeployedBackendDir) {
        if (resources.length > 0) {
            const resource = resources[0];
            if (resource.providerPlugin !== PROVIDER_NAME) {
                return undefined;
            }
        }
    }
    const parametersFilePath = path_1.default.join(resourceDir, PARAMETERS_FILENAME);
    if (!parameters && fs.pathExistsSync(parametersFilePath)) {
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
    const buildDir = path_1.default.normalize(path_1.default.join(resourceDir, 'build'));
    const schemaFilePath = path_1.default.normalize(path_1.default.join(resourceDir, SCHEMA_FILENAME));
    const schemaDirPath = path_1.default.normalize(path_1.default.join(resourceDir, SCHEMA_DIR_NAME));
    if (!options.dryRun) {
        fs.ensureDirSync(buildDir);
    }
    const buildConfig = await (0, transformer_options_v2_1.generateTransformerOptions)(context, options);
    if (!buildConfig) {
        return undefined;
    }
    const transformerOutput = await buildAPIProject(context, buildConfig);
    amplify_prompts_1.printer.success(`GraphQL schema compiled successfully.\n\nEdit your schema at ${schemaFilePath} or \
place .graphql files in a directory at ${schemaDirPath}`);
    if ((0, auth_mode_compare_1.isAuthModeUpdated)(options)) {
        parameters.AuthModeLastUpdated = new Date();
    }
    if (!options.dryRun) {
        amplify_cli_core_1.JSONUtilities.writeJson(parametersFilePath, parameters);
    }
    return transformerOutput;
};
exports.transformGraphQLSchemaV2 = transformGraphQLSchemaV2;
const getAuthenticationTypesForAuthConfig = (authConfig) => {
    var _a;
    return [authConfig === null || authConfig === void 0 ? void 0 : authConfig.defaultAuthentication, ...((_a = authConfig === null || authConfig === void 0 ? void 0 : authConfig.additionalAuthenticationProviders) !== null && _a !== void 0 ? _a : [])].map((authConfigEntry) => authConfigEntry === null || authConfigEntry === void 0 ? void 0 : authConfigEntry.authenticationType);
};
const hasIamAuth = (authConfig) => getAuthenticationTypesForAuthConfig(authConfig).some((authType) => authType === 'AWS_IAM');
const hasUserPoolAuth = (authConfig) => getAuthenticationTypesForAuthConfig(authConfig).some((authType) => authType === 'AMAZON_COGNITO_USER_POOLS');
const getSqlDbTypeFromDataSourceTypes = (dataSourceTypes) => {
    const dbTypes = Object.values(dataSourceTypes)
        .map((dsType) => dsType.dbType)
        .filter(graphql_transformer_core_1.isSqlDbType);
    if (dbTypes.length === 0) {
        return undefined;
    }
    if (new Set(dbTypes).size > 1) {
        throw new Error(`Multiple imported SQL datasource types ${Array.from(dbTypes)} are detected. Only one type is supported.`);
    }
    return dbTypes[0];
};
const fixUpDataSourceStrategiesProvider = async (context, projectConfig) => {
    var _a;
    const modelToDatasourceMap = (_a = projectConfig.modelToDatasourceMap) !== null && _a !== void 0 ? _a : new Map();
    const datasourceMapValues = modelToDatasourceMap ? Array.from(modelToDatasourceMap.values()) : [];
    const dataSourceStrategies = {};
    modelToDatasourceMap.forEach((value, key) => {
        if (!(0, graphql_transformer_core_1.isDynamoDbType)(value.dbType)) {
            return;
        }
        switch (value.provisionStrategy) {
            case 'DEFAULT':
                dataSourceStrategies[key] = graphql_transformer_core_1.DDB_DEFAULT_DATASOURCE_STRATEGY;
                break;
            case 'AMPLIFY_TABLE':
                dataSourceStrategies[key] = graphql_transformer_core_1.DDB_AMPLIFY_MANAGED_DATASOURCE_STRATEGY;
                break;
            default:
                throw new Error(`Unsupported provisionStrategy ${value.provisionStrategy}`);
        }
    });
    const sqlDbType = getSqlDbTypeFromDataSourceTypes(datasourceMapValues);
    let sqlDirectiveDataSourceStrategies;
    if (sqlDbType) {
        const dbConnectionConfig = getDbConnectionConfig();
        const vpcConfiguration = await isSqlLambdaVpcConfigRequired(context, sqlDbType);
        const strategy = {
            name: (0, graphql_transformer_core_1.getDefaultStrategyNameForDbType)(sqlDbType),
            dbType: sqlDbType,
            dbConnectionConfig,
            vpcConfiguration,
        };
        modelToDatasourceMap.forEach((value, key) => {
            if (!(0, graphql_transformer_core_1.isSqlDbType)(value.dbType)) {
                return;
            }
            dataSourceStrategies[key] = strategy;
        });
        let customSqlStatements;
        if (typeof projectConfig.customQueries === 'object') {
            customSqlStatements = {};
            projectConfig.customQueries.forEach((value, key) => {
                customSqlStatements[key] = value;
            });
        }
        sqlDirectiveDataSourceStrategies = (0, graphql_transformer_core_1.constructSqlDirectiveDataSourceStrategies)(projectConfig.schema, strategy, customSqlStatements);
    }
    return {
        dataSourceStrategies,
        sqlDirectiveDataSourceStrategies,
    };
};
const buildAPIProject = async (context, opts) => {
    var _a, _b, _c;
    const schema = opts.projectConfig.schema.toString();
    if (!schema) {
        return undefined;
    }
    const { dataSourceStrategies, sqlDirectiveDataSourceStrategies } = await fixUpDataSourceStrategiesProvider(context, opts.projectConfig);
    (0, utils_1.checkForUnsupportedDirectives)(schema, { dataSourceStrategies });
    const useBetaSqlLayer = (_c = (_b = (_a = context === null || context === void 0 ? void 0 : context.input) === null || _a === void 0 ? void 0 : _a.options) === null || _b === void 0 ? void 0 : _b[USE_BETA_SQL_LAYER]) !== null && _c !== void 0 ? _c : false;
    let rdsLayerMapping = undefined;
    let rdsSnsTopicMapping = undefined;
    if ((0, utils_1.containsSqlModelOrDirective)(dataSourceStrategies, sqlDirectiveDataSourceStrategies)) {
        rdsLayerMapping = await getRDSLayerMapping(context, useBetaSqlLayer);
        rdsSnsTopicMapping = await getRDSSNSTopicMapping(context, useBetaSqlLayer);
    }
    const transformManager = new transform_manager_1.TransformManager(opts.overrideConfig, hasIamAuth(opts.authConfig), hasUserPoolAuth(opts.authConfig), await (0, utils_2.getAdminRoles)(context, opts.resourceName), await (0, utils_2.getIdentityPoolId)(context));
    (0, graphql_transformer_1.executeTransform)({
        ...opts,
        scope: transformManager.rootStack,
        nestedStackProvider: transformManager.getNestedStackProvider(),
        assetProvider: transformManager.getAssetProvider(),
        parameterProvider: transformManager.getParameterProvider(),
        synthParameters: transformManager.getSynthParameters(),
        schema,
        dataSourceStrategies,
        sqlDirectiveDataSourceStrategies,
        printTransformerLog,
        rdsLayerMapping,
        rdsSnsTopicMapping,
    });
    const transformOutput = {
        ...transformManager.generateDeploymentResources(),
        userOverriddenSlots: opts.userDefinedSlots ? (0, exports.getUserOverridenSlots)(opts.userDefinedSlots) : [],
    };
    const builtProject = (0, utils_2.mergeUserConfigWithTransformOutput)(opts.projectConfig, transformOutput, opts);
    const buildLocation = path_1.default.join(opts.projectDirectory, 'build');
    const currentCloudLocation = opts.currentCloudBackendDirectory ? path_1.default.join(opts.currentCloudBackendDirectory, 'build') : undefined;
    if (opts.projectDirectory && !opts.dryRun) {
        await (0, utils_2.writeDeploymentToDisk)(context, builtProject, buildLocation, opts.rootStackFileName, opts.buildParameters);
        await (0, graphql_transformer_core_2.sanityCheckProject)(currentCloudLocation, buildLocation, opts.rootStackFileName, opts.sanityCheckRules.diffRules, opts.sanityCheckRules.projectRules);
    }
    return builtProject;
};
const getUserOverridenSlots = (userDefinedSlots) => Object.values(userDefinedSlots)
    .flat()
    .flatMap((slot) => { var _a, _b; return [(_a = slot.requestResolver) === null || _a === void 0 ? void 0 : _a.fileName, (_b = slot.responseResolver) === null || _b === void 0 ? void 0 : _b.fileName]; })
    .flat()
    .filter((slotName) => slotName !== undefined);
exports.getUserOverridenSlots = getUserOverridenSlots;
const getRDSLayerMapping = async (context, useBetaSqlLayer = false) => {
    const bucket = `${graphql_transformer_common_1.ResourceConstants.RESOURCES.SQLLayerManifestBucket}${useBetaSqlLayer ? '-beta' : ''}`;
    const region = context.amplify.getProjectMeta().providers.awscloudformation.Region;
    const url = `https://${bucket}.s3.amazonaws.com/${graphql_transformer_common_1.ResourceConstants.RESOURCES.SQLLayerVersionManifestKeyPrefix}${region}`;
    const response = await (0, node_fetch_1.default)(url);
    if (response.status === 200) {
        const result = await response.text();
        const mapping = {
            [region]: {
                layerRegion: result,
            },
        };
        return mapping;
    }
    else {
        throw new Error(`Unable to retrieve layer mapping from ${url} with status code ${response.status}.`);
    }
};
const getRDSSNSTopicMapping = async (context, useBetaSqlLayer = false) => {
    const bucket = `${graphql_transformer_common_1.ResourceConstants.RESOURCES.SQLLayerManifestBucket}${useBetaSqlLayer ? '-beta' : ''}`;
    const region = context.amplify.getProjectMeta().providers.awscloudformation.Region;
    const url = `https://${bucket}.s3.amazonaws.com/${graphql_transformer_common_1.ResourceConstants.RESOURCES.SQLSNSTopicARNManifestKeyPrefix}${region}`;
    const response = await (0, node_fetch_1.default)(url);
    if (response.status === 200) {
        const result = await response.text();
        const mapping = {
            [region]: {
                topicArn: result,
            },
        };
        return mapping;
    }
    else {
        throw new Error(`Unable to retrieve sns topic ARN mapping from ${url} with status code ${response.status}.`);
    }
};
const isSqlLambdaVpcConfigRequired = async (context, dbType) => {
    const vpcSubnetConfig = await getSQLLambdaVpcConfig(context, dbType);
    return vpcSubnetConfig;
};
const getDbConnectionConfig = () => {
    const apiName = (0, amplify_meta_utils_1.getAppSyncAPIName)();
    const secretsKey = (0, database_resources_1.getSecretsKey)();
    const paths = (0, database_resources_1.getExistingConnectionDbConnectionConfig)(apiName, secretsKey);
    return paths;
};
const getSQLLambdaVpcConfig = async (context, dbType) => {
    const [secretsKey, engine] = [(0, database_resources_1.getSecretsKey)(), (0, graphql_transformer_core_1.getImportedRDSTypeFromStrategyDbType)(dbType)];
    const { secrets } = await (0, database_resources_1.getConnectionSecrets)(context, secretsKey, engine);
    const region = context.amplify.getProjectMeta().providers.awscloudformation.Region;
    const vpcConfig = await (0, graphql_schema_generator_1.getHostVpc)(secrets.host, region);
    return vpcConfig;
};
const printTransformerLog = (log) => {
    switch (log.level) {
        case graphql_transformer_interfaces_1.TransformerLogLevel.ERROR:
            amplify_prompts_1.printer.error(log.message);
            break;
        case graphql_transformer_interfaces_1.TransformerLogLevel.WARN:
            amplify_prompts_1.printer.warn(log.message);
            break;
        case graphql_transformer_interfaces_1.TransformerLogLevel.INFO:
            amplify_prompts_1.printer.info(log.message);
            break;
        case graphql_transformer_interfaces_1.TransformerLogLevel.DEBUG:
            amplify_prompts_1.printer.debug(log.message);
            break;
        default:
            amplify_prompts_1.printer.error(log.message);
    }
};
//# sourceMappingURL=transform-graphql-schema-v2.js.map