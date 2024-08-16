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
exports.getIAMPolicies = exports.migrate = exports.askApiKeyQuestions = exports.askAuthQuestions = exports.askAdditionalAuthQuestions = exports.updateWalkthrough = exports.serviceWalkthrough = exports.serviceApiInputWalkthrough = exports.openConsole = void 0;
const path = __importStar(require("path"));
const aws_cdk_lib_1 = require("aws-cdk-lib");
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs-extra"));
const graphql_transformer_core_1 = require("graphql-transformer-core");
const inquirer_1 = __importDefault(require("inquirer"));
const lodash_1 = __importDefault(require("lodash"));
const uuid_1 = require("uuid");
const category_constants_1 = require("../../../category-constants");
const aws_constants_1 = require("../aws-constants");
const appSync_defaults_1 = require("../default-values/appSync-defaults");
const syncAssets_1 = require("../sync-conflict-handler-assets/syncAssets");
const amplify_meta_utils_1 = require("../utils/amplify-meta-utils");
const auth_config_to_app_sync_auth_type_bi_di_mapper_1 = require("../utils/auth-config-to-app-sync-auth-type-bi-di-mapper");
const check_appsync_api_migration_1 = require("../utils/check-appsync-api-migration");
const global_sandbox_mode_1 = require("../utils/global-sandbox-mode");
const resolver_config_to_conflict_resolution_bi_di_mapper_1 = require("../utils/resolver-config-to-conflict-resolution-bi-di-mapper");
const serviceName = 'AppSync';
const elasticContainerServiceName = 'ElasticContainer';
const providerName = 'awscloudformation';
const graphqlSchemaDir = path.join(aws_constants_1.rootAssetDir, 'graphql-schemas');
const FunctionServiceNameLambdaFunction = 'Lambda';
const authProviderChoices = [
    {
        name: 'API key',
        value: 'API_KEY',
    },
    {
        name: 'Amazon Cognito User Pool',
        value: 'AMAZON_COGNITO_USER_POOLS',
    },
    {
        name: 'IAM',
        value: 'AWS_IAM',
    },
    {
        name: 'OpenID Connect',
        value: 'OPENID_CONNECT',
    },
];
const conflictResolutionHanlderChoices = [
    {
        name: 'Auto Merge',
        value: 'AUTOMERGE',
    },
    {
        name: 'Optimistic Concurrency',
        value: 'OPTIMISTIC_CONCURRENCY',
    },
    {
        name: 'Custom Lambda',
        value: 'LAMBDA',
    },
    {
        name: 'Learn More',
        value: 'Learn More',
    },
];
const blankSchemaFile = 'blank-schema.graphql';
const schemaTemplatesV1 = [
    {
        name: 'Single object with fields (e.g., “Todo” with ID, name, description)',
        value: 'single-object-schema.graphql',
    },
    {
        name: 'One-to-many relationship (e.g., “Blogs” with “Posts” and “Comments”)',
        value: 'many-relationship-schema.graphql',
    },
    {
        name: 'Objects with fine-grained access control (e.g., a project management app with owner-based authorization)',
        value: 'single-object-auth-schema.graphql',
    },
    {
        name: 'Blank Schema',
        value: blankSchemaFile,
    },
];
const schemaTemplatesV2 = [
    {
        name: 'Single object with fields (e.g., “Todo” with ID, name, description)',
        value: 'single-object-schema-v2.graphql',
    },
    {
        name: 'One-to-many relationship (e.g., “Blogs” with “Posts” and “Comments”)',
        value: 'many-relationship-schema-v2.graphql',
    },
    {
        name: 'Objects with fine-grained access control (e.g., a project management app with owner-based authorization)',
        value: 'single-object-auth-schema-v2.graphql',
    },
    {
        name: 'Blank Schema',
        value: blankSchemaFile,
    },
];
const openConsole = async (context) => {
    var _a;
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    const categoryAmplifyMeta = amplifyMeta[category_constants_1.category];
    const { Region } = amplifyMeta.providers[providerName];
    const graphQLApis = Object.keys(categoryAmplifyMeta).filter((resourceName) => {
        const resource = categoryAmplifyMeta[resourceName];
        return (resource.output &&
            (resource.service === serviceName || (resource.service === elasticContainerServiceName && resource.apiType === 'GRAPHQL')));
    });
    if (graphQLApis) {
        let url;
        let selectedApi = graphQLApis[0];
        if (graphQLApis.length > 1) {
            ({ selectedApi } = await inquirer_1.default.prompt({
                type: 'list',
                name: 'selectedApi',
                choices: graphQLApis,
                message: 'Please select the API',
            }));
        }
        const selectedResource = categoryAmplifyMeta[selectedApi];
        if (selectedResource.service === serviceName) {
            const { output: { GraphQLAPIIdOutput }, } = selectedResource;
            const appId = amplifyMeta.providers[providerName].AmplifyAppId;
            if (!appId) {
                throw new Error('Missing AmplifyAppId in amplify-meta.json');
            }
            url = `https://console.aws.amazon.com/appsync/home?region=${Region}#/${GraphQLAPIIdOutput}/v1/queries`;
            const providerPlugin = await (_a = context.amplify.getProviderPlugins(context)[providerName], Promise.resolve().then(() => __importStar(require(_a))));
            const { isAdminApp, region } = await providerPlugin.isAmplifyAdminApp(appId);
            if (isAdminApp) {
                if (region !== Region) {
                    amplify_prompts_1.printer.warn(`Region mismatch: Amplify service returned '${region}', but found '${Region}' in amplify-meta.json.`);
                }
                const { envName } = context.amplify.getEnvInfo();
                const baseUrl = providerPlugin.adminBackendMap[region].amplifyAdminUrl;
                url = `${baseUrl}/admin/${appId}/${envName}/datastore`;
            }
        }
        else {
            const { output: { PipelineName, ServiceName, ClusterName }, } = selectedResource;
            const codePipeline = 'CodePipeline';
            const elasticContainer = 'ElasticContainer';
            const { selectedConsole } = await inquirer_1.default.prompt({
                name: 'selectedConsole',
                message: 'Which console you want to open',
                type: 'list',
                choices: [
                    {
                        name: 'Elastic Container Service (Deployed container status)',
                        value: elasticContainer,
                    },
                    {
                        name: 'CodePipeline (Container build status)',
                        value: codePipeline,
                    },
                ],
            });
            if (selectedConsole === elasticContainer) {
                url = `https://console.aws.amazon.com/ecs/home?region=${Region}#/clusters/${ClusterName}/services/${ServiceName}/details`;
            }
            else if (selectedConsole === codePipeline) {
                url = `https://${Region}.console.aws.amazon.com/codesuite/codepipeline/pipelines/${PipelineName}/view`;
            }
            else {
                amplify_prompts_1.printer.error('Option not available');
                return;
            }
        }
        await (0, amplify_cli_core_1.open)(url, { wait: false });
    }
    else {
        amplify_prompts_1.printer.error('AppSync API is not pushed in the cloud.');
    }
};
exports.openConsole = openConsole;
const serviceApiInputWalkthrough = async (context, serviceMetadata) => {
    let continuePrompt = false;
    let authConfig;
    let defaultAuthType;
    let resolverConfig;
    const { amplify } = context;
    const { inputs } = serviceMetadata;
    const allDefaultValues = (0, appSync_defaults_1.getAllDefaults)(amplify.getProjectDetails());
    let resourceAnswers = {};
    resourceAnswers[inputs[1].key] = allDefaultValues[inputs[1].key];
    resourceAnswers[inputs[0].key] = resourceAnswers[inputs[1].key];
    authConfig = {
        defaultAuthentication: {
            apiKeyConfig: {
                apiKeyExpirationDays: 7,
            },
            authenticationType: 'API_KEY',
        },
        additionalAuthenticationProviders: [],
    };
    while (!continuePrompt) {
        const getAuthModeChoice = async () => {
            if (authConfig.defaultAuthentication.authenticationType === 'API_KEY') {
                return `${authProviderChoices.find((choice) => choice.value === authConfig.defaultAuthentication.authenticationType).name} (default, expiration time: ${authConfig.defaultAuthentication.apiKeyConfig.apiKeyExpirationDays} days from now)`;
            }
            return `${authProviderChoices.find((choice) => choice.value === authConfig.defaultAuthentication.authenticationType).name} (default)`;
        };
        const getAdditionalAuthModeChoices = async () => {
            let additionalAuthModesText = '';
            authConfig.additionalAuthenticationProviders.map(async (authMode) => {
                additionalAuthModesText += `, ${authProviderChoices.find((choice) => choice.value === authMode.authenticationType).name}`;
            });
            return additionalAuthModesText;
        };
        const basicInfoQuestionChoices = [];
        basicInfoQuestionChoices.push({
            name: (0, chalk_1.default) `{bold Name:} ${resourceAnswers[inputs[1].key]}`,
            value: 'API_NAME',
        });
        basicInfoQuestionChoices.push({
            name: (0, chalk_1.default) `{bold Authorization modes:} ${await getAuthModeChoice()}${await getAdditionalAuthModeChoices()}`,
            value: 'API_AUTH_MODE',
        });
        basicInfoQuestionChoices.push({
            name: (0, chalk_1.default) `{bold Conflict detection (required for DataStore):} ${(resolverConfig === null || resolverConfig === void 0 ? void 0 : resolverConfig.project) ? 'Enabled' : 'Disabled'}`,
            value: 'CONFLICT_DETECTION',
        });
        if (resolverConfig === null || resolverConfig === void 0 ? void 0 : resolverConfig.project) {
            basicInfoQuestionChoices.push({
                name: (0, chalk_1.default) `{bold Conflict resolution strategy:} ${conflictResolutionHanlderChoices.find((x) => x.value === resolverConfig.project.ConflictHandler).name}`,
                value: 'CONFLICT_STRATEGY',
            });
        }
        basicInfoQuestionChoices.push({
            name: 'Continue',
            value: 'CONTINUE',
        });
        const basicInfoQuestion = {
            type: 'list',
            name: 'basicApiSettings',
            message: 'Here is the GraphQL API that we will create. Select a setting to edit or continue',
            default: 'CONTINUE',
            choices: basicInfoQuestionChoices,
        };
        let { basicApiSettings } = await inquirer_1.default.prompt([basicInfoQuestion]);
        switch (basicApiSettings) {
            case 'API_NAME': {
                const resourceQuestions = [
                    {
                        type: inputs[1].type,
                        name: inputs[1].key,
                        message: inputs[1].question,
                        validate: amplify.inputValidation(inputs[1]),
                        default: () => {
                            const defaultValue = allDefaultValues[inputs[1].key];
                            return defaultValue;
                        },
                    },
                ];
                resourceAnswers = await inquirer_1.default.prompt(resourceQuestions);
                resourceAnswers[inputs[0].key] = resourceAnswers[inputs[1].key];
                allDefaultValues[inputs[1].key] = resourceAnswers[inputs[1].key];
                break;
            }
            case 'API_AUTH_MODE':
                ({ authConfig, defaultAuthType } = await askDefaultAuthQuestion(context));
                ({ authConfig } = await askAdditionalQuestions(context, authConfig, defaultAuthType));
                break;
            case 'CONFLICT_DETECTION':
                resolverConfig = await askResolverConflictQuestion(context, resolverConfig);
                break;
            case 'CONFLICT_STRATEGY':
                resolverConfig = await askResolverConflictHandlerQuestion(context);
                break;
            case 'CONTINUE':
                continuePrompt = true;
                break;
        }
    }
    return {
        answers: resourceAnswers,
        output: {
            authConfig,
        },
        resolverConfig,
    };
};
exports.serviceApiInputWalkthrough = serviceApiInputWalkthrough;
const updateApiInputWalkthrough = async (context, project, resolverConfig, modelTypes) => {
    let authConfig;
    let defaultAuthType;
    const updateChoices = [
        {
            name: 'Authorization modes',
            value: 'AUTH_MODE',
        },
    ];
    if (project.config && !lodash_1.default.isEmpty(project.config.ResolverConfig)) {
        updateChoices.push({
            name: 'Conflict resolution strategy',
            value: 'CONFLICT_STRATEGY',
        });
        updateChoices.push({
            name: 'Disable conflict detection',
            value: 'DISABLE_CONFLICT',
        });
    }
    else {
        updateChoices.push({
            name: 'Enable conflict detection (required for DataStore)',
            value: 'ENABLE_CONFLICT',
        });
    }
    const updateOptionQuestion = {
        type: 'list',
        name: 'updateOption',
        message: 'Select a setting to edit',
        choices: updateChoices,
    };
    const { updateOption } = await inquirer_1.default.prompt([updateOptionQuestion]);
    if (updateOption === 'ENABLE_CONFLICT') {
        resolverConfig = await askResolverConflictHandlerQuestion(context, modelTypes);
    }
    else if (updateOption === 'DISABLE_CONFLICT') {
        resolverConfig = {};
    }
    else if (updateOption === 'AUTH_MODE') {
        ({ authConfig, defaultAuthType } = await askDefaultAuthQuestion(context));
        authConfig = await askAdditionalAuthQuestions(context, authConfig, defaultAuthType);
    }
    else if (updateOption === 'CONFLICT_STRATEGY') {
        resolverConfig = await askResolverConflictHandlerQuestion(context, modelTypes);
    }
    return {
        authConfig,
        resolverConfig,
    };
};
const serviceWalkthrough = async (context, serviceMetadata) => {
    const resourceName = resourceAlreadyExists();
    const transformerVersion = await amplify_cli_core_1.ApiCategoryFacade.getTransformerVersion(context);
    await addLambdaAuthorizerChoice(context);
    if (resourceName) {
        const errMessage = 'You already have an AppSync API in your project. Use the "amplify update api" command to update your existing AppSync API.';
        amplify_prompts_1.printer.warn(errMessage);
        await context.usageData.emitError(new amplify_cli_core_1.ResourceAlreadyExistsError(errMessage));
        (0, amplify_cli_core_1.exitOnNextTick)(0);
    }
    const { amplify } = context;
    const { inputs } = serviceMetadata;
    const basicInfoAnswers = await (0, exports.serviceApiInputWalkthrough)(context, serviceMetadata);
    let schemaContent = '';
    let askToEdit = true;
    const schemaTemplateOptions = transformerVersion === 2 ? schemaTemplatesV2 : schemaTemplatesV1;
    const templateSelectionQuestion = {
        type: inputs[4].type,
        name: inputs[4].key,
        message: inputs[4].question,
        choices: schemaTemplateOptions.filter(templateSchemaFilter(basicInfoAnswers.output.authConfig)),
        validate: amplify.inputValidation(inputs[4]),
    };
    const { templateSelection } = await inquirer_1.default.prompt(templateSelectionQuestion);
    const schemaFilePath = path.join(graphqlSchemaDir, templateSelection);
    schemaContent += transformerVersion === 2 ? (0, global_sandbox_mode_1.defineGlobalSandboxMode)((0, amplify_cli_core_1.getGraphQLTransformerAuthDocLink)(transformerVersion)) : '';
    schemaContent += fs.readFileSync(schemaFilePath, 'utf8');
    return {
        ...basicInfoAnswers,
        noCfnFile: true,
        schemaContent,
        askToEdit,
    };
};
exports.serviceWalkthrough = serviceWalkthrough;
const updateWalkthrough = async (context) => {
    const { allResources } = await context.amplify.getResourceStatus();
    let resourceDir;
    let resourceName;
    let resource;
    let authConfig;
    const resources = allResources.filter((resource) => resource.service === 'AppSync');
    await addLambdaAuthorizerChoice(context);
    if (resources.length > 0) {
        resource = resources[0];
        if (resource.providerPlugin !== providerName) {
            throw new Error(`The selected resource is not managed using AWS Cloudformation. Please use the AWS AppSync Console to make updates to your API - ${resource.resourceName}`);
        }
        ({ resourceName } = resource);
        resourceDir = amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, category_constants_1.category, resourceName);
    }
    else {
        const errMessage = 'No AppSync resource to update. Use the "amplify add api" command to update your existing AppSync API.';
        amplify_prompts_1.printer.error(errMessage);
        await context.usageData.emitError(new amplify_cli_core_1.ResourceDoesNotExistError(errMessage));
        (0, amplify_cli_core_1.exitOnNextTick)(0);
    }
    await (0, check_appsync_api_migration_1.checkAppsyncApiResourceMigration)(context, resourceName, true);
    const project = await (0, graphql_transformer_core_1.readProjectConfiguration)(resourceDir);
    let resolverConfig = project.config.ResolverConfig;
    await displayApiInformation(context, resource, project);
    const directiveMap = (0, graphql_transformer_core_1.collectDirectivesByTypeNames)(project.schema);
    let modelTypes = [];
    if (directiveMap.types) {
        Object.keys(directiveMap.types).forEach((type) => {
            if (directiveMap.types[type].includes('model')) {
                modelTypes.push(type);
            }
        });
    }
    ({ authConfig, resolverConfig } = await updateApiInputWalkthrough(context, project, resolverConfig, modelTypes));
    return {
        version: 1,
        serviceModification: {
            serviceName: 'AppSync',
            defaultAuthType: (0, auth_config_to_app_sync_auth_type_bi_di_mapper_1.authConfigToAppSyncAuthType)(authConfig ? authConfig.defaultAuthentication : undefined),
            additionalAuthTypes: authConfig && authConfig.additionalAuthenticationProviders
                ? authConfig.additionalAuthenticationProviders.map(auth_config_to_app_sync_auth_type_bi_di_mapper_1.authConfigToAppSyncAuthType)
                : undefined,
            conflictResolution: (0, resolver_config_to_conflict_resolution_bi_di_mapper_1.resolverConfigToConflictResolution)(resolverConfig),
        },
    };
};
exports.updateWalkthrough = updateWalkthrough;
async function displayApiInformation(context, resource, project) {
    var _a, _b, _c;
    let authModes = [];
    authModes.push(`- Default: ${await displayAuthMode(context, resource, resource.output.authConfig.defaultAuthentication.authenticationType)}`);
    await ((_a = resource.output.authConfig.additionalAuthenticationProviders) === null || _a === void 0 ? void 0 : _a.map(async (authMode) => {
        authModes.push(`- ${await displayAuthMode(context, resource, authMode.authenticationType)}`);
    }));
    amplify_prompts_1.printer.info('');
    amplify_prompts_1.printer.info('General information');
    amplify_prompts_1.printer.info('- Name: '.concat(resource.resourceName));
    if ((_b = resource === null || resource === void 0 ? void 0 : resource.output) === null || _b === void 0 ? void 0 : _b.GraphQLAPIEndpointOutput) {
        amplify_prompts_1.printer.info(`- API endpoint: ${(_c = resource === null || resource === void 0 ? void 0 : resource.output) === null || _c === void 0 ? void 0 : _c.GraphQLAPIEndpointOutput}`);
    }
    amplify_prompts_1.printer.info('');
    amplify_prompts_1.printer.info('Authorization modes');
    authModes.forEach((authMode) => amplify_prompts_1.printer.info(authMode));
    amplify_prompts_1.printer.info('');
    amplify_prompts_1.printer.info('Conflict detection (required for DataStore)');
    if (project.config && !lodash_1.default.isEmpty(project.config.ResolverConfig)) {
        amplify_prompts_1.printer.info(`- Conflict resolution strategy: ${conflictResolutionHanlderChoices.find((choice) => choice.value === project.config.ResolverConfig.project.ConflictHandler).name}`);
    }
    else {
        amplify_prompts_1.printer.info('- Disabled');
    }
    amplify_prompts_1.printer.info('');
}
async function displayAuthMode(context, resource, authMode) {
    var _a;
    if (authMode === 'API_KEY' && resource.output.GraphQLAPIKeyOutput) {
        let { apiKeys } = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'getGraphQLApiKeys', {
            apiId: resource.output.GraphQLAPIIdOutput,
        });
        let apiKeyExpires = (_a = apiKeys.find((key) => key.id == resource.output.GraphQLAPIKeyOutput)) === null || _a === void 0 ? void 0 : _a.expires;
        if (!apiKeyExpires) {
            return authProviderChoices.find((choice) => choice.value === authMode).name;
        }
        let apiKeyExpiresDate = new Date(apiKeyExpires * 1000);
        return `${authProviderChoices.find((choice) => choice.value === authMode).name} expiring ${apiKeyExpiresDate}: ${resource.output.GraphQLAPIKeyOutput}`;
    }
    return authProviderChoices.find((choice) => choice.value === authMode).name;
}
async function askAdditionalQuestions(context, authConfig, defaultAuthType, modelTypes) {
    authConfig = await askAdditionalAuthQuestions(context, authConfig, defaultAuthType);
    return { authConfig };
}
async function askResolverConflictQuestion(context, resolverConfig, modelTypes) {
    let resolverConfigResponse = {};
    if (await context.prompt.confirm('Enable conflict detection?', !(resolverConfig === null || resolverConfig === void 0 ? void 0 : resolverConfig.project))) {
        resolverConfigResponse = await askResolverConflictHandlerQuestion(context, modelTypes);
    }
    return resolverConfigResponse;
}
async function askResolverConflictHandlerQuestion(context, modelTypes) {
    let resolverConfig = {};
    const askConflictResolutionStrategy = async (msg) => {
        let conflictResolutionStrategy;
        do {
            const conflictResolutionQuestion = {
                type: 'list',
                name: 'conflictResolutionStrategy',
                message: msg,
                default: 'AUTOMERGE',
                choices: conflictResolutionHanlderChoices,
            };
            if (conflictResolutionStrategy === 'Learn More') {
                conflictResolutionQuestion.prefix = syncAssets_1.dataStoreLearnMore;
            }
            ({ conflictResolutionStrategy } = await inquirer_1.default.prompt([conflictResolutionQuestion]));
        } while (conflictResolutionStrategy === 'Learn More');
        let syncConfig = {
            ConflictHandler: conflictResolutionStrategy,
            ConflictDetection: 'VERSION',
        };
        if (conflictResolutionStrategy === 'LAMBDA') {
            const { newFunction, lambdaFunctionName } = await askSyncFunctionQuestion();
            syncConfig.LambdaConflictHandler = {
                name: lambdaFunctionName,
                new: newFunction,
            };
        }
        return syncConfig;
    };
    resolverConfig.project = await askConflictResolutionStrategy('Select the default resolution strategy');
    if (modelTypes && modelTypes.length > 0) {
        if (await context.prompt.confirm('Do you want to override default per model settings?', false)) {
            const modelTypeQuestion = {
                type: 'checkbox',
                name: 'selectedModelTypes',
                message: 'Select the models from below:',
                choices: modelTypes,
            };
            const { selectedModelTypes } = await inquirer_1.default.prompt([modelTypeQuestion]);
            if (selectedModelTypes.length > 0) {
                resolverConfig.models = {};
                for (const modelType of selectedModelTypes) {
                    resolverConfig.models[modelType] = await askConflictResolutionStrategy(`Select the resolution strategy for ${modelType} model`);
                }
            }
        }
    }
    return resolverConfig;
}
async function askSyncFunctionQuestion() {
    const syncLambdaQuestion = {
        type: 'list',
        name: 'syncLambdaAnswer',
        message: 'Select from the options below',
        choices: [
            {
                name: 'Create a new Lambda Function',
                value: 'NEW',
            },
            {
                name: 'Existing Lambda Function',
                value: 'EXISTING',
            },
        ],
    };
    const { syncLambdaAnswer } = await inquirer_1.default.prompt([syncLambdaQuestion]);
    let lambdaFunctionName;
    const newFunction = syncLambdaAnswer === 'NEW';
    if (!newFunction) {
        const syncLambdaNameQuestion = {
            type: 'input',
            name: 'lambdaFunctionName',
            message: 'Enter lambda function name',
            validate: (val) => !!val,
        };
        ({ lambdaFunctionName } = await inquirer_1.default.prompt([syncLambdaNameQuestion]));
    }
    return { newFunction, lambdaFunctionName };
}
async function addLambdaAuthorizerChoice(context) {
    const transformerVersion = await amplify_cli_core_1.ApiCategoryFacade.getTransformerVersion(context);
    if (transformerVersion === 2 && !authProviderChoices.some((choice) => choice.value == 'AWS_LAMBDA')) {
        authProviderChoices.push({
            name: 'Lambda',
            value: 'AWS_LAMBDA',
        });
    }
}
async function askDefaultAuthQuestion(context) {
    await addLambdaAuthorizerChoice(context);
    const currentAuthConfig = (0, amplify_meta_utils_1.getAppSyncAuthConfig)(amplify_cli_core_1.stateManager.getMeta());
    const currentDefaultAuth = currentAuthConfig && currentAuthConfig.defaultAuthentication ? currentAuthConfig.defaultAuthentication.authenticationType : undefined;
    const defaultAuthTypeQuestion = {
        type: 'list',
        name: 'defaultAuthType',
        message: 'Choose the default authorization type for the API',
        choices: authProviderChoices,
        default: currentDefaultAuth,
    };
    const { defaultAuthType } = await inquirer_1.default.prompt([defaultAuthTypeQuestion]);
    const defaultAuth = await askAuthQuestions(defaultAuthType, context, false, currentAuthConfig === null || currentAuthConfig === void 0 ? void 0 : currentAuthConfig.defaultAuthentication);
    return {
        authConfig: {
            defaultAuthentication: defaultAuth,
        },
        defaultAuthType,
    };
}
async function askAdditionalAuthQuestions(context, authConfig, defaultAuthType) {
    var _a;
    const currentAuthConfig = (0, amplify_meta_utils_1.getAppSyncAuthConfig)(amplify_cli_core_1.stateManager.getMeta());
    authConfig.additionalAuthenticationProviders = [];
    if (await context.prompt.confirm('Configure additional auth types?')) {
        const remainingAuthProviderChoices = authProviderChoices.filter((p) => p.value !== defaultAuthType);
        const currentAdditionalAuth = (currentAuthConfig && currentAuthConfig.additionalAuthenticationProviders
            ? currentAuthConfig.additionalAuthenticationProviders
            : []).map((authProvider) => authProvider.authenticationType);
        const additionalProvidersQuestion = {
            type: 'checkbox',
            name: 'authType',
            message: 'Choose the additional authorization types you want to configure for the API',
            choices: remainingAuthProviderChoices,
            default: currentAdditionalAuth,
        };
        const additionalProvidersAnswer = await inquirer_1.default.prompt([additionalProvidersQuestion]);
        for (const authProvider of additionalProvidersAnswer.authType) {
            const config = await askAuthQuestions(authProvider, context, true, (_a = currentAuthConfig === null || currentAuthConfig === void 0 ? void 0 : currentAuthConfig.additionalAuthenticationProviders) === null || _a === void 0 ? void 0 : _a.find((authSetting) => authSetting.authenticationType == authProvider));
            authConfig.additionalAuthenticationProviders.push(config);
        }
    }
    else {
        authConfig.additionalAuthenticationProviders = ((currentAuthConfig === null || currentAuthConfig === void 0 ? void 0 : currentAuthConfig.additionalAuthenticationProviders) || []).filter((p) => p.authenticationType !== defaultAuthType);
    }
    return authConfig;
}
exports.askAdditionalAuthQuestions = askAdditionalAuthQuestions;
async function askAuthQuestions(authType, context, printLeadText = false, authSettings) {
    if (authType === 'AMAZON_COGNITO_USER_POOLS') {
        if (printLeadText) {
            amplify_prompts_1.printer.info('Cognito UserPool configuration');
        }
        const userPoolConfig = await askUserPoolQuestions(context);
        return userPoolConfig;
    }
    if (authType === 'API_KEY') {
        if (printLeadText) {
            amplify_prompts_1.printer.info('API key configuration');
        }
        const apiKeyConfig = await askApiKeyQuestions(authSettings);
        return apiKeyConfig;
    }
    if (authType === 'AWS_IAM') {
        return {
            authenticationType: 'AWS_IAM',
        };
    }
    if (authType === 'OPENID_CONNECT') {
        if (printLeadText) {
            amplify_prompts_1.printer.info('OpenID Connect configuration');
        }
        const openIDConnectConfig = await askOpenIDConnectQuestions(authSettings);
        return openIDConnectConfig;
    }
    if (authType === 'AWS_LAMBDA') {
        if (printLeadText) {
            context.print.info('Lambda Authorizer configuration');
        }
        const lambdaConfig = await askLambdaQuestion(context);
        return lambdaConfig;
    }
    const errMessage = `Unknown authType: ${authType}`;
    amplify_prompts_1.printer.error(errMessage);
    await context.usageData.emitError(new amplify_cli_core_1.UnknownResourceTypeError(errMessage));
    (0, amplify_cli_core_1.exitOnNextTick)(1);
}
exports.askAuthQuestions = askAuthQuestions;
async function askUserPoolQuestions(context) {
    let authResourceName = (0, amplify_meta_utils_1.checkIfAuthExists)();
    if (!authResourceName) {
        authResourceName = await context.amplify.invokePluginMethod(context, 'auth', undefined, 'add', [context, true]);
    }
    else {
        amplify_prompts_1.printer.info('Use a Cognito user pool configured as a part of this project.');
    }
    authResourceName = `auth${authResourceName}`;
    return {
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
        userPoolConfig: {
            userPoolId: authResourceName,
        },
    };
}
async function askApiKeyQuestions(authSettings = undefined) {
    let defaultValues = {
        apiKeyExpirationDays: 7,
        description: '',
    };
    Object.assign(defaultValues, authSettings === null || authSettings === void 0 ? void 0 : authSettings.apiKeyConfig);
    const apiKeyQuestions = [
        {
            type: 'input',
            name: 'description',
            message: 'Enter a description for the API key:',
            default: defaultValues.description,
        },
        {
            type: 'input',
            name: 'apiKeyExpirationDays',
            message: 'After how many days from now the API key should expire (1-365):',
            default: defaultValues.apiKeyExpirationDays,
            validate: validateDays,
            filter: (value) => {
                const val = parseInt(value, 10);
                if (isNaN(val) || val <= 0 || val > 365) {
                    return value;
                }
                return val;
            },
        },
    ];
    const apiKeyConfig = {};
    for (const apiKeyQuestion of apiKeyQuestions) {
        apiKeyConfig[apiKeyQuestion.name] = await amplify_prompts_1.prompter.input(apiKeyQuestion.message, { initial: apiKeyQuestion.default });
    }
    const apiKeyExpirationDaysNum = Number(apiKeyConfig.apiKeyExpirationDays);
    apiKeyConfig.apiKeyExpirationDate = aws_cdk_lib_1.Expiration.after(aws_cdk_lib_1.Duration.days(apiKeyExpirationDaysNum)).date;
    apiKeyConfig.apiKeyExpirationDays = apiKeyExpirationDaysNum;
    return {
        authenticationType: 'API_KEY',
        apiKeyConfig,
    };
}
exports.askApiKeyQuestions = askApiKeyQuestions;
async function askOpenIDConnectQuestions(authSettings) {
    let defaultValues = {
        authTTL: undefined,
        clientId: undefined,
        iatTTL: undefined,
        issuerUrl: undefined,
        name: undefined,
    };
    Object.assign(defaultValues, authSettings === null || authSettings === void 0 ? void 0 : authSettings.openIDConnectConfig);
    const openIDConnectQuestions = [
        {
            type: 'input',
            name: 'name',
            message: 'Enter a name for the OpenID Connect provider:',
            default: defaultValues.name,
        },
        {
            type: 'input',
            name: 'issuerUrl',
            message: 'Enter the OpenID Connect provider domain (Issuer URL):',
            validate: validateIssuerUrl,
            default: defaultValues.issuerUrl,
        },
        {
            type: 'input',
            name: 'clientId',
            message: 'Enter the Client Id from your OpenID Client Connect application (optional):',
            default: defaultValues.clientId,
        },
        {
            type: 'input',
            name: 'iatTTL',
            message: 'Enter the number of milliseconds a token is valid after being issued to a user:',
            validate: validateTTL,
            default: defaultValues.iatTTL,
        },
        {
            type: 'input',
            name: 'authTTL',
            message: 'Enter the number of milliseconds a token is valid after being authenticated:',
            validate: validateTTL,
            default: defaultValues.authTTL,
        },
    ];
    const openIDConnectConfig = await inquirer_1.default.prompt(openIDConnectQuestions);
    return {
        authenticationType: 'OPENID_CONNECT',
        openIDConnectConfig,
    };
}
async function validateDays(input) {
    const isValid = /^\d{0,3}$/.test(input);
    const days = isValid ? parseInt(input, 10) : 0;
    if (!isValid || days < 1 || days > 365) {
        return 'Number of days must be between 1 and 365.';
    }
    return true;
}
function validateIssuerUrl(input) {
    const isValid = /^(((?!http:\/\/(?!localhost))([a-zA-Z0-9.]{1,}):\/\/([a-zA-Z0-9-._~:?#@!$&'()*+,;=/]{1,})\/)|(?!http)(?!https)([a-zA-Z0-9.]{1,}):\/\/)$/.test(input);
    if (!isValid) {
        return 'The value must be a valid URI with a trailing forward slash. HTTPS must be used instead of HTTP unless you are using localhost.';
    }
    return true;
}
function validateTTL(input) {
    const isValid = /^\d+$/.test(input);
    if (!isValid) {
        return 'The value must be a number.';
    }
    return true;
}
function resourceAlreadyExists() {
    const meta = amplify_cli_core_1.stateManager.getMeta();
    let resourceName;
    if (meta[category_constants_1.category]) {
        const categoryResources = meta[category_constants_1.category];
        for (const resource of Object.keys(categoryResources)) {
            if (categoryResources[resource].service === serviceName) {
                resourceName = resource;
                break;
            }
        }
    }
    return resourceName;
}
const migrate = async (context) => {
    await context.amplify.executeProviderUtils(context, 'awscloudformation', 'compileSchema', {
        forceCompile: true,
        migrate: true,
    });
};
exports.migrate = migrate;
const getIAMPolicies = (resourceName, operations) => {
    let policy = {};
    const resources = [];
    const actions = [];
    if (!amplify_cli_core_1.FeatureFlags.getBoolean('appSync.generateGraphQLPermissions')) {
        operations.forEach((crudOption) => {
            switch (crudOption) {
                case 'create':
                    actions.push('appsync:Create*', 'appsync:StartSchemaCreation', 'appsync:GraphQL');
                    resources.push(buildPolicyResource(resourceName, '/*'));
                    break;
                case 'update':
                    actions.push('appsync:Update*');
                    break;
                case 'read':
                    actions.push('appsync:Get*', 'appsync:List*');
                    break;
                case 'delete':
                    actions.push('appsync:Delete*');
                    break;
                default:
                    amplify_prompts_1.printer.info(`${crudOption} not supported`);
            }
        });
        resources.push(buildPolicyResource(resourceName, null));
    }
    else {
        actions.push('appsync:GraphQL');
        operations.forEach((operation) => resources.push(buildPolicyResource(resourceName, `/types/${operation}/*`)));
    }
    policy = {
        Effect: 'Allow',
        Action: actions,
        Resource: resources,
    };
    const attributes = ['GraphQLAPIIdOutput', 'GraphQLAPIEndpointOutput'];
    if ((0, amplify_meta_utils_1.authConfigHasApiKey)((0, amplify_meta_utils_1.getAppSyncAuthConfig)(amplify_cli_core_1.stateManager.getMeta()))) {
        attributes.push('GraphQLAPIKeyOutput');
    }
    return { policy, attributes };
};
exports.getIAMPolicies = getIAMPolicies;
const buildPolicyResource = (resourceName, path) => {
    return {
        'Fn::Join': [
            '',
            [
                'arn:aws:appsync:',
                { Ref: 'AWS::Region' },
                ':',
                { Ref: 'AWS::AccountId' },
                ':apis/',
                {
                    Ref: `${category_constants_1.category}${resourceName}GraphQLAPIIdOutput`,
                },
                ...(path ? [path] : []),
            ],
        ],
    };
};
const templateSchemaFilter = (authConfig) => {
    const authIncludesCognito = getAuthTypes(authConfig).includes('AMAZON_COGNITO_USER_POOLS');
    return (templateOption) => authIncludesCognito ||
        templateOption.name !== 'Objects with fine-grained access control (e.g., a project management app with owner-based authorization)';
};
const getAuthTypes = (authConfig) => {
    const additionalAuthTypes = (authConfig.additionalAuthenticationProviders || [])
        .map((provider) => provider.authenticationType)
        .filter((t) => !!t);
    const uniqueAuthTypes = new Set([...additionalAuthTypes, authConfig.defaultAuthentication.authenticationType]);
    return [...uniqueAuthTypes.keys()];
};
async function askLambdaQuestion(context) {
    const existingFunctions = functionsExist(context);
    const choices = [
        {
            name: 'Create a new Lambda function',
            value: 'newFunction',
        },
    ];
    if (existingFunctions) {
        choices.push({
            name: 'Use a Lambda function already added in the current Amplify project',
            value: 'projectFunction',
        });
    }
    let defaultFunctionType = 'newFunction';
    const lambdaAnswer = await inquirer_1.default.prompt({
        name: 'functionType',
        type: 'list',
        message: 'Choose a Lambda authorization function',
        choices,
        default: defaultFunctionType,
    });
    const { lambdaFunction } = await askLambdaSource(context, lambdaAnswer.functionType);
    const { ttlSeconds } = await inquirer_1.default.prompt({
        type: 'input',
        name: 'ttlSeconds',
        message: 'How long should the authorization response be cached in seconds?',
        validate: validateTTL,
        default: '300',
    });
    const lambdaAuthorizerConfig = {
        lambdaFunction,
        ttlSeconds,
    };
    return {
        authenticationType: 'AWS_LAMBDA',
        lambdaAuthorizerConfig,
    };
}
function functionsExist(context) {
    const functionResources = context.amplify.getProjectDetails().amplifyMeta.function;
    if (!functionResources) {
        return false;
    }
    const lambdaFunctions = [];
    Object.keys(functionResources).forEach((resourceName) => {
        if (functionResources[resourceName].service === FunctionServiceNameLambdaFunction) {
            lambdaFunctions.push(resourceName);
        }
    });
    return lambdaFunctions.length !== 0;
}
async function askLambdaSource(context, functionType) {
    switch (functionType) {
        case 'projectFunction':
            return await askLambdaFromProject(context);
        case 'newFunction':
            return await newLambdaFunction(context);
        default:
            throw new Error(`Type ${functionType} not supported`);
    }
}
async function newLambdaFunction(context) {
    const resourceName = await createLambdaAuthorizerFunction(context);
    return { lambdaFunction: resourceName };
}
async function askLambdaFromProject(context) {
    const functionResources = context.amplify.getProjectDetails().amplifyMeta.function;
    const lambdaFunctions = [];
    Object.keys(functionResources).forEach((resourceName) => {
        if (functionResources[resourceName].service === FunctionServiceNameLambdaFunction) {
            lambdaFunctions.push(resourceName);
        }
    });
    const answer = await inquirer_1.default.prompt({
        name: 'lambdaFunction',
        type: 'list',
        message: 'Choose one of the Lambda functions',
        choices: lambdaFunctions,
        default: lambdaFunctions[0],
    });
    await context.amplify.invokePluginMethod(context, 'function', undefined, 'addAppSyncInvokeMethodPermission', [answer.lambdaFunction]);
    return { lambdaFunction: answer.lambdaFunction };
}
async function createLambdaAuthorizerFunction(context) {
    const [shortId] = (0, uuid_1.v4)().split('-');
    const functionName = `graphQlLambdaAuthorizer${shortId}`;
    const resourceName = await context.amplify.invokePluginMethod(context, 'function', undefined, 'add', [
        context,
        'awscloudformation',
        FunctionServiceNameLambdaFunction,
        {
            functionName,
            defaultRuntime: 'nodejs',
            providerContext: {
                provider: 'awscloudformation',
            },
            template: 'lambda-auth',
            skipAdvancedSection: true,
            skipNextSteps: true,
        },
    ]);
    context.print.success(`Successfully added ${resourceName} function locally`);
    await context.amplify.invokePluginMethod(context, 'function', undefined, 'addAppSyncInvokeMethodPermission', [resourceName]);
    return resourceName;
}
//# sourceMappingURL=appSync-walkthrough.js.map