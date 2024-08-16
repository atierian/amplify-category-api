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
exports.writeResolverConfig = exports.getCfnApiArtifactHandler = void 0;
const path = __importStar(require("path"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const fs = __importStar(require("fs-extra"));
const graphql_transformer_core_1 = require("graphql-transformer-core");
const lodash_1 = __importDefault(require("lodash"));
const uuid_1 = require("uuid");
const category_constants_1 = require("../../category-constants");
const appsync_api_input_state_1 = require("./api-input-manager/appsync-api-input-state");
const aws_constants_1 = require("./aws-constants");
const amplify_meta_utils_1 = require("./utils/amplify-meta-utils");
const auth_config_to_app_sync_auth_type_bi_di_mapper_1 = require("./utils/auth-config-to-app-sync-auth-type-bi-di-mapper");
const print_api_key_warnings_1 = require("./utils/print-api-key-warnings");
const resolver_config_to_conflict_resolution_bi_di_mapper_1 = require("./utils/resolver-config-to-conflict-resolution-bi-di-mapper");
const FunctionServiceNameLambdaFunction = 'Lambda';
const getCfnApiArtifactHandler = (context) => new CfnApiArtifactHandler(context);
exports.getCfnApiArtifactHandler = getCfnApiArtifactHandler;
const resolversDirName = 'resolvers';
const stacksDirName = 'stacks';
const defaultStackName = 'CustomResources.json';
const defaultCfnParameters = (apiName) => ({
    AppSyncApiName: apiName,
    DynamoDBBillingMode: 'PAY_PER_REQUEST',
    DynamoDBEnableServerSideEncryption: false,
});
class CfnApiArtifactHandler {
    constructor(context) {
        this.createArtifacts = async (request) => {
            const meta = amplify_cli_core_1.stateManager.getMeta();
            const existingApiName = (0, amplify_meta_utils_1.getAppSyncResourceName)(meta);
            if (existingApiName) {
                throw new amplify_cli_core_1.AmplifyError('ResourceAlreadyExistsError', {
                    message: `GraphQL API ${existingApiName} already exists in the project`,
                    resolution: 'Use amplify update api to make modifications',
                });
            }
            const serviceConfig = request.serviceConfiguration;
            (0, amplify_cli_core_1.isResourceNameUnique)('api', serviceConfig.apiName);
            const resourceDir = this.getResourceDir(serviceConfig.apiName);
            fs.ensureDirSync(resourceDir);
            const resolverDirectoryPath = path.join(resourceDir, resolversDirName);
            if (!fs.existsSync(resolverDirectoryPath)) {
                fs.mkdirSync(resolverDirectoryPath);
            }
            const stacksDirectoryPath = path.join(resourceDir, stacksDirName);
            if (!fs.existsSync(stacksDirectoryPath)) {
                fs.mkdirSync(stacksDirectoryPath);
                fs.copyFileSync(path.join(aws_constants_1.rootAssetDir, 'resolver-readme', 'RESOLVER_README.md'), path.join(resolverDirectoryPath, 'README.md'));
            }
            await this.updateTransformerConfigVersion(resourceDir);
            serviceConfig.conflictResolution = await this.createResolverResources(serviceConfig.conflictResolution);
            await (0, exports.writeResolverConfig)(serviceConfig.conflictResolution, resourceDir);
            const appsyncCLIInputs = await this.generateAppsyncCLIInputs(serviceConfig);
            fs.copyFileSync(path.join(aws_constants_1.rootAssetDir, 'cloudformation-templates', 'defaultCustomResources.json'), path.join(resourceDir, stacksDirName, defaultStackName));
            const authConfig = this.extractAuthConfig(appsyncCLIInputs.serviceConfiguration);
            const dependsOn = amendDependsOnForAuthConfig([], authConfig);
            const apiParameters = this.getCfnParameters(serviceConfig.apiName, authConfig, resourceDir);
            this.ensureCfnParametersExist(resourceDir, apiParameters);
            this.context.amplify.updateamplifyMetaAfterResourceAdd(category_constants_1.category, serviceConfig.apiName, this.createAmplifyMeta(authConfig, dependsOn));
            if (serviceConfig === null || serviceConfig === void 0 ? void 0 : serviceConfig.transformSchema) {
                this.writeSchema(path.join(resourceDir, aws_constants_1.gqlSchemaFilename), serviceConfig.transformSchema);
                await this.context.amplify.executeProviderUtils(this.context, 'awscloudformation', 'compileSchema', {
                    resourceDir,
                    parameters: apiParameters,
                    authConfig,
                });
            }
            return serviceConfig.apiName;
        };
        this.updateArtifacts = async (request, opts) => {
            var _a, _b, _c;
            const updates = request.serviceModification;
            const apiName = (0, amplify_meta_utils_1.getAppSyncResourceName)(amplify_cli_core_1.stateManager.getMeta());
            if (!apiName) {
                throw new amplify_cli_core_1.AmplifyError('NotImplementedError', {
                    message: `${amplify_cli_core_1.AmplifySupportedService.APPSYNC} API does not exist`,
                    resolution: "To add an api, use 'amplify add api'",
                });
            }
            const resourceDir = this.getResourceDir(apiName);
            if (updates.conflictResolution) {
                updates.conflictResolution = await this.createResolverResources(updates.conflictResolution);
                await (0, exports.writeResolverConfig)(updates.conflictResolution, resourceDir);
            }
            const gqlSchemaPath = await this.updateAppsyncCLIInputs(updates, apiName);
            if (updates.transformSchema) {
                this.writeSchema(gqlSchemaPath, updates.transformSchema);
            }
            const authConfig = (0, amplify_meta_utils_1.getAppSyncAuthConfig)(amplify_cli_core_1.stateManager.getMeta());
            const previousAuthConfig = lodash_1.default.cloneDeep(authConfig);
            const oldConfigHadApiKey = (0, amplify_meta_utils_1.authConfigHasApiKey)(authConfig);
            if (updates.defaultAuthType) {
                authConfig.defaultAuthentication = (0, auth_config_to_app_sync_auth_type_bi_di_mapper_1.appSyncAuthTypeToAuthConfig)(updates.defaultAuthType);
            }
            if (updates.additionalAuthTypes) {
                authConfig.additionalAuthenticationProviders = updates.additionalAuthTypes.map(auth_config_to_app_sync_auth_type_bi_di_mapper_1.appSyncAuthTypeToAuthConfig);
            }
            if (!(opts === null || opts === void 0 ? void 0 : opts.skipCompile)) {
                await this.context.amplify.executeProviderUtils(this.context, 'awscloudformation', 'compileSchema', {
                    resourceDir,
                    parameters: this.getCfnParameters(apiName, authConfig, resourceDir),
                    authConfig,
                    previousAuthConfig,
                });
            }
            this.context.amplify.updateamplifyMetaAfterResourceUpdate(category_constants_1.category, apiName, 'output', { authConfig });
            this.context.amplify.updateBackendConfigAfterResourceUpdate(category_constants_1.category, apiName, 'output', { authConfig });
            const existingDependsOn = ((_c = (_b = (_a = amplify_cli_core_1.stateManager.getBackendConfig()) === null || _a === void 0 ? void 0 : _a[category_constants_1.category]) === null || _b === void 0 ? void 0 : _b[apiName]) === null || _c === void 0 ? void 0 : _c.dependsOn) || [];
            const newDependsOn = amendDependsOnForAuthConfig(existingDependsOn, authConfig);
            this.context.amplify.updateBackendConfigAfterResourceUpdate(category_constants_1.category, apiName, 'dependsOn', newDependsOn);
            this.context.amplify.updateamplifyMetaAfterResourceUpdate(category_constants_1.category, apiName, 'dependsOn', newDependsOn);
            (0, print_api_key_warnings_1.printApiKeyWarnings)(oldConfigHadApiKey, (0, amplify_meta_utils_1.authConfigHasApiKey)(authConfig));
        };
        this.writeSchema = (resourceDir, schema) => {
            fs.writeFileSync(resourceDir, schema);
        };
        this.getResourceDir = (apiName) => amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, category_constants_1.category, apiName);
        this.createAmplifyMeta = (authConfig, dependsOn) => ({
            service: 'AppSync',
            providerPlugin: aws_constants_1.provider,
            dependsOn,
            output: {
                authConfig,
            },
        });
        this.extractAuthConfig = (config) => ({
            defaultAuthentication: (0, auth_config_to_app_sync_auth_type_bi_di_mapper_1.appSyncAuthTypeToAuthConfig)(config.defaultAuthType),
            additionalAuthenticationProviders: (config.additionalAuthTypes || []).map(auth_config_to_app_sync_auth_type_bi_di_mapper_1.appSyncAuthTypeToAuthConfig),
        });
        this.updateTransformerConfigVersion = async (resourceDir) => {
            const localTransformerConfig = await (0, graphql_transformer_core_1.readTransformerConfiguration)(resourceDir);
            localTransformerConfig.Version = graphql_transformer_core_1.TRANSFORM_CURRENT_VERSION;
            localTransformerConfig.ElasticsearchWarning = true;
            await (0, graphql_transformer_core_1.writeTransformerConfiguration)(resourceDir, localTransformerConfig);
        };
        this.createResolverResources = async (conflictResolution = {}) => {
            const newConflictResolution = lodash_1.default.cloneDeep(conflictResolution);
            const generateLambdaIfNew = async (strategy) => {
                if (strategy && strategy.type === 'LAMBDA' && strategy.resolver.type === 'NEW') {
                    strategy.resolver = {
                        type: 'EXISTING',
                        name: await this.createSyncFunction(),
                    };
                }
            };
            await generateLambdaIfNew(newConflictResolution.defaultResolutionStrategy);
            await Promise.all((newConflictResolution.perModelResolutionStrategy || [])
                .map((perModelStrategy) => perModelStrategy.resolutionStrategy)
                .map(generateLambdaIfNew));
            return newConflictResolution;
        };
        this.getCfnParameters = (apiName, authConfig, resourceDir) => {
            const cfnPath = path.join(resourceDir, aws_constants_1.cfnParametersFilename);
            const params = amplify_cli_core_1.JSONUtilities.readJson(cfnPath, { throwIfNotExist: false }) || defaultCfnParameters(apiName);
            const cognitoPool = this.getCognitoUserPool(authConfig);
            if (cognitoPool) {
                params.AuthCognitoUserPoolId = cognitoPool;
            }
            else {
                delete params.AuthCognitoUserPoolId;
            }
            return params;
        };
        this.getCognitoUserPool = (authConfig) => {
            const additionalUserPoolProvider = (authConfig.additionalAuthenticationProviders || []).find((aap) => aap.authenticationType === 'AMAZON_COGNITO_USER_POOLS');
            const defaultAuth = authConfig.defaultAuthentication;
            if (!((defaultAuth === null || defaultAuth === void 0 ? void 0 : defaultAuth.authenticationType) === 'AMAZON_COGNITO_USER_POOLS') && !additionalUserPoolProvider) {
                return undefined;
            }
            let userPoolId;
            const configuredUserPoolName = (0, amplify_meta_utils_1.checkIfAuthExists)();
            if (authConfig.userPoolConfig) {
                ({ userPoolId } = authConfig.userPoolConfig);
            }
            else if (additionalUserPoolProvider && additionalUserPoolProvider.userPoolConfig) {
                ({ userPoolId } = additionalUserPoolProvider.userPoolConfig);
            }
            else if (configuredUserPoolName) {
                userPoolId = `auth${configuredUserPoolName}`;
            }
            else {
                throw new Error('Cannot find a configured Cognito User Pool.');
            }
            return {
                'Fn::GetAtt': [userPoolId, 'Outputs.UserPoolId'],
            };
        };
        this.createSyncFunction = async () => {
            const targetDir = amplify_cli_core_1.pathManager.getBackendDirPath();
            const assetDir = path.normalize(path.join(aws_constants_1.rootAssetDir, 'sync-conflict-handler'));
            const [shortId] = (0, uuid_1.v4)().split('-');
            const functionName = `syncConflictHandler${shortId}`;
            const functionProps = {
                functionName: `${functionName}`,
                roleName: `${functionName}LambdaRole`,
            };
            const copyJobs = [
                {
                    dir: assetDir,
                    template: 'sync-conflict-handler-index.js.ejs',
                    target: path.join(targetDir, 'function', functionName, 'src', 'index.js'),
                },
                {
                    dir: assetDir,
                    template: 'sync-conflict-handler-package.json.ejs',
                    target: path.join(targetDir, 'function', functionName, 'src', 'package.json'),
                },
                {
                    dir: assetDir,
                    template: 'sync-conflict-handler-template.json.ejs',
                    target: path.join(targetDir, 'function', functionName, `${functionName}-cloudformation-template.json`),
                },
            ];
            await this.context.amplify.copyBatch(this.context, copyJobs, functionProps, true);
            const backendConfigs = {
                service: FunctionServiceNameLambdaFunction,
                providerPlugin: aws_constants_1.provider,
                build: true,
            };
            await this.context.amplify.updateamplifyMetaAfterResourceAdd('function', functionName, backendConfigs);
            amplify_prompts_1.printer.success(`Successfully added ${functionName} function locally`);
            return `${functionName}-\${env}`;
        };
        this.generateAppsyncCLIInputs = async (serviceConfig) => {
            const appsyncCLIInputs = {
                version: 1,
                serviceConfiguration: {
                    apiName: serviceConfig.apiName,
                    serviceName: serviceConfig.serviceName,
                    defaultAuthType: serviceConfig.defaultAuthType,
                },
            };
            if (!lodash_1.default.isEmpty(serviceConfig.additionalAuthTypes)) {
                appsyncCLIInputs.serviceConfiguration.additionalAuthTypes = serviceConfig.additionalAuthTypes;
            }
            if (!lodash_1.default.isEmpty(serviceConfig.conflictResolution)) {
                appsyncCLIInputs.serviceConfiguration.conflictResolution = {
                    defaultResolutionStrategy: serviceConfig.conflictResolution.defaultResolutionStrategy,
                    perModelResolutionStrategy: serviceConfig.conflictResolution.perModelResolutionStrategy,
                };
            }
            const cliState = new appsync_api_input_state_1.AppsyncApiInputState(this.context, serviceConfig.apiName);
            await cliState.saveCLIInputPayload(appsyncCLIInputs);
            return appsyncCLIInputs;
        };
        this.updateAppsyncCLIInputs = async (updates, apiName) => {
            var _a;
            const cliState = new appsync_api_input_state_1.AppsyncApiInputState(this.context, apiName);
            const gqlSchemaPath = path.join(this.getResourceDir(apiName), aws_constants_1.gqlSchemaFilename);
            if (!cliState.cliInputFileExists()) {
                return gqlSchemaPath;
            }
            const prevAppsyncInputs = cliState.getCLIInputPayload();
            const appsyncInputs = prevAppsyncInputs;
            if ((_a = appsyncInputs.serviceConfiguration) === null || _a === void 0 ? void 0 : _a.gqlSchemaPath) {
                delete appsyncInputs.serviceConfiguration.gqlSchemaPath;
            }
            if (updates.conflictResolution) {
                appsyncInputs.serviceConfiguration.conflictResolution = updates.conflictResolution;
            }
            if (updates.defaultAuthType) {
                appsyncInputs.serviceConfiguration.defaultAuthType = updates.defaultAuthType;
            }
            if (updates.additionalAuthTypes) {
                appsyncInputs.serviceConfiguration.additionalAuthTypes = updates.additionalAuthTypes;
            }
            await cliState.saveCLIInputPayload(appsyncInputs);
            return gqlSchemaPath;
        };
        this.ensureCfnParametersExist = (resourceDir, parameters) => {
            const parametersFilePath = path.join(resourceDir, aws_constants_1.cfnParametersFilename);
            if (!fs.existsSync(parametersFilePath)) {
                amplify_cli_core_1.JSONUtilities.writeJson(parametersFilePath, parameters);
            }
        };
        this.context = context;
    }
}
const writeResolverConfig = async (conflictResolution, resourceDir) => {
    const localTransformerConfig = await (0, graphql_transformer_core_1.readTransformerConfiguration)(resourceDir);
    localTransformerConfig.ResolverConfig = (0, resolver_config_to_conflict_resolution_bi_di_mapper_1.conflictResolutionToResolverConfig)(conflictResolution);
    await (0, graphql_transformer_core_1.writeTransformerConfiguration)(resourceDir, localTransformerConfig);
};
exports.writeResolverConfig = writeResolverConfig;
const amendDependsOnForAuthConfig = (currentDependsOn, authConfig) => {
    if (hasCognitoAuthMode(authConfig)) {
        return ensureDependsOnAuth(currentDependsOn);
    }
    return ensureNoDependsOnAuth(currentDependsOn);
};
const hasCognitoAuthMode = (authConfig) => {
    var _a, _b;
    return ((_a = authConfig === null || authConfig === void 0 ? void 0 : authConfig.defaultAuthentication) === null || _a === void 0 ? void 0 : _a.authenticationType) === 'AMAZON_COGNITO_USER_POOLS' ||
        ((_b = authConfig === null || authConfig === void 0 ? void 0 : authConfig.additionalAuthenticationProviders) === null || _b === void 0 ? void 0 : _b.find((aap) => aap.authenticationType === 'AMAZON_COGNITO_USER_POOLS')) !== undefined;
};
const ensureDependsOnAuth = (currentDependsOn) => {
    const authResourceName = (0, amplify_meta_utils_1.checkIfAuthExists)();
    if (!authResourceName) {
        return [];
    }
    if (currentDependsOn.find((dep) => dep.category === 'auth' && dep.resourceName === authResourceName)) {
        return currentDependsOn;
    }
    return currentDependsOn.concat({
        category: 'auth',
        resourceName: authResourceName,
        attributes: ['UserPoolId'],
    });
};
const ensureNoDependsOnAuth = (currentDependsOn) => {
    const authResourceName = (0, amplify_meta_utils_1.checkIfAuthExists)();
    if (!authResourceName) {
        return currentDependsOn;
    }
    const authIdx = currentDependsOn.findIndex((dep) => dep.category === 'auth' && dep.resourceName === authResourceName);
    if (authIdx < 0) {
        return currentDependsOn;
    }
    const newDependsOn = Array.from(currentDependsOn);
    newDependsOn.splice(authIdx, 1);
    return newDependsOn;
};
//# sourceMappingURL=cfn-api-artifact-handler.js.map