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
Object.defineProperty(exports, "__esModule", { value: true });
exports.logDebug = exports.runAppSyncSimulator = exports.terminateDDB = exports.reDeploy = exports.deploy = exports.launchDDBLocal = exports.defaultTransformParams = exports.transformAndSynth = void 0;
const path = __importStar(require("path"));
const amplify_appsync_simulator_1 = require("@aws-amplify/amplify-appsync-simulator");
const dynamoEmulator = __importStar(require("amplify-category-api-dynamodb-simulator"));
const fs = __importStar(require("fs-extra"));
const uuid_1 = require("uuid");
const amplify_nodejs_function_runtime_provider_1 = require("amplify-nodejs-function-runtime-provider");
const graphql_transformer_1 = require("@aws-amplify/graphql-transformer");
const graphql_transformer_test_utils_1 = require("@aws-amplify/graphql-transformer-test-utils");
const graphql_transformer_core_1 = require("@aws-amplify/graphql-transformer-core");
const appsync_resource_processor_1 = require("../../CFNParser/appsync-resource-processor");
const dynamo_db_1 = require("../../utils/dynamo-db");
const lambda_helper_1 = require("./lambda-helper");
const invoke = (0, amplify_nodejs_function_runtime_provider_1.functionRuntimeContributorFactory)({}).invoke;
__exportStar(require("./graphql-client"), exports);
jest.mock('@aws-amplify/amplify-cli-core', () => ({
    pathManager: {
        getAmplifyPackageLibDirPath: jest.fn().mockReturnValue('../amplify-dynamodb-simulator'),
    },
}));
const getAuthenticationTypesForAuthConfig = (authConfig) => {
    var _a;
    return [authConfig === null || authConfig === void 0 ? void 0 : authConfig.defaultAuthentication, ...((_a = authConfig === null || authConfig === void 0 ? void 0 : authConfig.additionalAuthenticationProviders) !== null && _a !== void 0 ? _a : [])].map((authConfigEntry) => authConfigEntry === null || authConfigEntry === void 0 ? void 0 : authConfigEntry.authenticationType);
};
const hasIamAuth = (authConfig) => getAuthenticationTypesForAuthConfig(authConfig).some((authType) => authType === 'AWS_IAM');
const hasUserPoolAuth = (authConfig) => getAuthenticationTypesForAuthConfig(authConfig).some((authType) => authType === 'AMAZON_COGNITO_USER_POOLS');
const transformAndSynth = (options) => {
    var _a;
    const transformManager = new graphql_transformer_test_utils_1.TransformManager();
    (0, graphql_transformer_1.executeTransform)({
        ...options,
        scope: transformManager.rootStack,
        nestedStackProvider: transformManager.getNestedStackProvider(),
        assetProvider: transformManager.getAssetProvider(),
        synthParameters: transformManager.getSynthParameters(hasIamAuth(options.authConfig), hasUserPoolAuth(options.authConfig)),
        dataSourceStrategies: (_a = options.dataSourceStrategies) !== null && _a !== void 0 ? _a : (0, graphql_transformer_core_1.constructDataSourceStrategies)(options.schema, graphql_transformer_core_1.DDB_DEFAULT_DATASOURCE_STRATEGY),
    });
    return transformManager.generateDeploymentResources();
};
exports.transformAndSynth = transformAndSynth;
exports.defaultTransformParams = {
    transformersFactoryArgs: {},
    transformParameters: {
        shouldDeepMergeDirectiveConfigDefaults: true,
        disableResolverDeduping: false,
        sandboxModeEnabled: false,
        useSubUsernameForDefaultIdentityClaim: true,
        subscriptionsInheritPrimaryAuth: false,
        populateOwnerFieldForStaticGroupAuth: true,
        suppressApiKeyGeneration: false,
        secondaryKeyAsGSI: true,
        enableAutoIndexQueryNames: true,
        respectPrimaryKeyAttributesOnConnectionField: true,
        enableSearchNodeToNodeEncryption: false,
        enableTransformerCfnOutputs: true,
        allowDestructiveGraphqlSchemaUpdates: false,
        replaceTableUponGsiUpdate: false,
        allowGen1Patterns: true,
    },
};
async function launchDDBLocal() {
    let dbPath;
    while (true) {
        dbPath = path.join('/tmp', `amplify-cli-emulator-dynamodb-${(0, uuid_1.v4)()}`);
        if (!fs.existsSync(dbPath))
            break;
    }
    fs.ensureDirSync(dbPath);
    const emulator = await dynamoEmulator.launch({
        dbPath,
        port: null,
    });
    const client = await dynamoEmulator.getClient(emulator);
    logDebug(dbPath);
    return { emulator, dbPath, client };
}
exports.launchDDBLocal = launchDDBLocal;
async function deploy(transformerOutput, client) {
    let config = (0, appsync_resource_processor_1.processTransformerStacks)(transformerOutput);
    config.appSync.apiKey = 'da-fake-api-key';
    if (client) {
        await (0, dynamo_db_1.createAndUpdateTable)(client, config);
        config = (0, dynamo_db_1.configureDDBDataSource)(config, client.config);
    }
    configureLambdaDataSource(config);
    const simulator = await runAppSyncSimulator(config);
    return { simulator, config };
}
exports.deploy = deploy;
async function reDeploy(transformerOutput, simulator, client) {
    let config = (0, appsync_resource_processor_1.processTransformerStacks)(transformerOutput);
    config.appSync.apiKey = 'da-fake-api-key';
    if (client) {
        await (0, dynamo_db_1.createAndUpdateTable)(client, config);
        config = (0, dynamo_db_1.configureDDBDataSource)(config, client.config);
    }
    configureLambdaDataSource(config);
    simulator === null || simulator === void 0 ? void 0 : simulator.reload(config);
    return { simulator, config };
}
exports.reDeploy = reDeploy;
async function configureLambdaDataSource(config) {
    config.dataSources
        .filter((d) => d.type === 'AWS_LAMBDA')
        .forEach((d) => {
        const arn = d.LambdaFunctionArn;
        const arnParts = arn.split(':');
        let functionName = arnParts[arnParts.length - 1];
        const lambdaConfig = (0, lambda_helper_1.getFunctionDetails)(functionName);
        d.invoke = (payload) => {
            logDebug('Invoking lambda with config', lambdaConfig);
            return invoke({
                srcRoot: lambdaConfig.packageFolder,
                runtime: 'nodejs',
                handler: `${functionName}.${lambdaConfig.handler}`,
                event: JSON.stringify(payload),
            });
        };
    });
    return config;
}
async function terminateDDB(emulator, dbPath) {
    try {
        if (emulator && emulator.terminate) {
            await emulator.terminate();
        }
    }
    catch (e) {
        logDebug('Failed to terminate the Local DynamoDB Server', e);
    }
    try {
        fs.removeSync(dbPath);
    }
    catch (e) {
        logDebug('Failed delete Local DynamoDB Server Folder', e);
    }
}
exports.terminateDDB = terminateDDB;
async function runAppSyncSimulator(config, port, wsPort) {
    const appsyncSimulator = new amplify_appsync_simulator_1.AmplifyAppSyncSimulator({ port, wsPort });
    await appsyncSimulator.start();
    await appsyncSimulator.init(config);
    return appsyncSimulator;
}
exports.runAppSyncSimulator = runAppSyncSimulator;
function logDebug(...msgs) {
    if (process.env.DEBUG || process.env.CI) {
        console.log(...msgs);
    }
}
exports.logDebug = logDebug;
//# sourceMappingURL=index.js.map