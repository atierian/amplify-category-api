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
exports.APITest = exports.MOCK_API_PORT = exports.MOCK_API_KEY = exports.GRAPHQL_API_KEY_OUTPUT = exports.GRAPHQL_API_ENDPOINT_OUTPUT = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const dynamoEmulator = __importStar(require("amplify-category-api-dynamodb-simulator"));
const amplify_appsync_simulator_1 = require("@aws-amplify/amplify-appsync-simulator");
const amplify_codegen_1 = require("amplify-codegen");
const chokidar = __importStar(require("chokidar"));
const amplify_category_function_1 = require("@aws-amplify/amplify-category-function");
const utils_1 = require("../utils");
const CFNParser_1 = require("../CFNParser");
const config_override_1 = require("../utils/config-override");
const dynamo_db_1 = require("../utils/dynamo-db");
const mock_config_file_1 = require("../utils/mock-config-file");
const func_1 = require("../func");
const lambda_arn_to_config_1 = require("./lambda-arn-to-config");
const resolver_overrides_1 = require("./resolver-overrides");
const run_graphql_transformer_1 = require("./run-graphql-transformer");
exports.GRAPHQL_API_ENDPOINT_OUTPUT = 'GraphQLAPIEndpointOutput';
exports.GRAPHQL_API_KEY_OUTPUT = 'GraphQLAPIKeyOutput';
exports.MOCK_API_KEY = 'da2-fakeApiId123456';
exports.MOCK_API_PORT = 20002;
class APITest {
    constructor() {
        this.apiParameters = {};
        this.userOverriddenSlots = [];
    }
    async start(context, port = exports.MOCK_API_PORT, wsPort = 20003) {
        try {
            context.amplify.addCleanUpTask(async (context) => {
                await this.stop(context);
            });
            this.configOverrideManager = await config_override_1.ConfigOverrideManager.getInstance(context);
            await (0, utils_1.checkJavaVersion)(context);
            this.apiName = await this.getAppSyncAPI(context);
            this.ddbClient = await this.startDynamoDBLocalServer(context);
            const resolverDirectory = await this.getResolverTemplateDirectory(context);
            this.resolverOverrideManager = new resolver_overrides_1.ResolverOverrides(resolverDirectory);
            this.apiParameters = await this.loadAPIParameters(context);
            this.appSyncSimulator = new amplify_appsync_simulator_1.AmplifyAppSyncSimulator({
                port,
                wsPort,
            });
            await this.appSyncSimulator.start();
            await this.resolverOverrideManager.start();
            await this.watch(context);
            const appSyncConfig = await this.runTransformer(context, this.apiParameters);
            this.appSyncSimulator.init(appSyncConfig);
            await this.generateTestFrontendExports(context);
            await this.generateCode(context, appSyncConfig);
            context.print.info(`AppSync Mock endpoint is running at ${this.appSyncSimulator.url}`);
        }
        catch (e) {
            context.print.error(`Failed to start API Mock endpoint ${e}`);
        }
    }
    async stop(context) {
        this.ddbClient = null;
        if (this.watcher) {
            await this.watcher.close();
            this.watcher = null;
        }
        try {
            if (this.ddbEmulator) {
                await this.ddbEmulator.terminate();
                this.ddbEmulator = null;
            }
        }
        catch (e) {
            context.print.error(`Failed to stop DynamoDB Local Server ${e.message}`);
        }
        await this.appSyncSimulator.stop();
        this.resolverOverrideManager.stop();
    }
    async runTransformer(context, parameters = {}) {
        const { transformerOutput } = await (0, run_graphql_transformer_1.runTransformer)(context);
        let config = (0, CFNParser_1.processAppSyncResources)(transformerOutput, parameters);
        await this.ensureDDBTables(config);
        config = this.configureDDBDataSource(config);
        this.transformerResult = await this.configureLambdaDataSource(context, config);
        this.userOverriddenSlots = transformerOutput.userOverriddenSlots;
        const overriddenTemplates = await this.resolverOverrideManager.sync(this.transformerResult.mappingTemplates, this.userOverriddenSlots);
        return { ...this.transformerResult, mappingTemplates: overriddenTemplates };
    }
    async generateCode(context, config = null) {
        try {
            context.print.info('Running GraphQL codegen');
            const { projectPath } = context.amplify.getEnvInfo();
            const schemaPath = path.join(projectPath, 'amplify', 'backend', 'api', this.apiName, 'build', 'schema.graphql');
            if (config && config.schema) {
                fs.writeFileSync(schemaPath, config.schema.content);
            }
            if (!(0, amplify_codegen_1.isCodegenConfigured)(context, this.apiName)) {
                await (0, amplify_codegen_1.add)(context);
            }
            else {
                (0, amplify_codegen_1.switchToSDLSchema)(context, this.apiName);
                await (0, amplify_codegen_1.generate)(context);
            }
        }
        catch (e) {
            context.print.info(`Failed to run GraphQL codegen with following error:\n${e.message}`);
        }
    }
    async reload(context, filePath, action) {
        const apiDir = await this.getAPIBackendDirectory(context);
        const inputSchemaPath = path.join(apiDir, 'schema');
        const customStackPath = path.join(apiDir, 'stacks');
        const parameterFilePath = await this.getAPIParameterFilePath(context);
        try {
            let shouldReload;
            if (this.resolverOverrideManager.isTemplateFile(filePath, action === 'unlink')) {
                switch (action) {
                    case 'add':
                        shouldReload = this.resolverOverrideManager.onAdd(filePath);
                        break;
                    case 'change':
                        shouldReload = this.resolverOverrideManager.onChange(filePath);
                        break;
                    case 'unlink':
                        shouldReload = this.resolverOverrideManager.onUnlink(filePath);
                        break;
                }
                if (shouldReload) {
                    context.print.info('Mapping template change detected. Reloading...');
                    const mappingTemplates = this.resolverOverrideManager.sync(this.transformerResult.mappingTemplates, this.userOverriddenSlots);
                    await this.appSyncSimulator.reload({
                        ...this.transformerResult,
                        mappingTemplates,
                    });
                }
            }
            else if (filePath.includes(inputSchemaPath)) {
                context.print.info('GraphQL Schema change detected. Reloading...');
                const config = await this.runTransformer(context, this.apiParameters);
                await this.appSyncSimulator.reload(config);
                await this.generateCode(context, config);
            }
            else if (filePath.includes(parameterFilePath)) {
                const apiParameters = await this.loadAPIParameters(context);
                if (JSON.stringify(apiParameters) !== JSON.stringify(this.apiParameters)) {
                    context.print.info('API Parameter change detected. Reloading...');
                    this.apiParameters = apiParameters;
                    const config = await this.runTransformer(context, this.apiParameters);
                    await this.appSyncSimulator.reload(config);
                    await this.generateCode(context, config);
                }
            }
            else if (filePath.includes(customStackPath)) {
                context.print.info('Custom stack change detected. Reloading...');
                const config = await this.runTransformer(context, this.apiParameters);
                await this.appSyncSimulator.reload(config);
                await this.generateCode(context, config);
            }
        }
        catch (e) {
            context.print.info(`Reloading failed with error\n${e}`);
        }
    }
    async generateTestFrontendExports(context) {
        await this.generateFrontendExports(context, {
            endpoint: `${this.appSyncSimulator.url}/graphql`,
            name: this.apiName,
            GraphQLAPIKeyOutput: this.transformerResult.appSync.apiKey,
            additionalAuthenticationProviders: [],
            securityType: this.transformerResult.appSync.authenticationType,
            testMode: true,
        });
    }
    async ensureDDBTables(config) {
        const tables = config.tables.map((t) => t.Properties);
        await (0, dynamo_db_1.createAndUpdateTable)(this.ddbClient, config);
    }
    async configureLambdaDataSource(context, config) {
        const lambdaDataSources = config.dataSources.filter((d) => d.type === 'AWS_LAMBDA');
        if (lambdaDataSources.length === 0) {
            return config;
        }
        return {
            ...config,
            dataSources: await Promise.all(config.dataSources.map(async (d) => {
                if (d.type !== 'AWS_LAMBDA') {
                    return d;
                }
                const lambdaConfig = await (0, lambda_arn_to_config_1.lambdaArnToConfig)(context, d.LambdaFunctionArn);
                const invoker = await (0, amplify_category_function_1.getInvoker)(context, {
                    resourceName: lambdaConfig.name,
                    handler: lambdaConfig.handler,
                    envVars: lambdaConfig.environment,
                });
                return {
                    ...d,
                    invoke: (payload) => {
                        return (0, func_1.timeConstrainedInvoker)(invoker({
                            event: payload,
                        }), context.input.options);
                    },
                };
            })),
        };
    }
    async watch(context) {
        this.watcher = await this.registerWatcher(context);
        this.watcher
            .on('add', (path) => {
            this.reload(context, path, 'add');
        })
            .on('change', (path) => {
            this.reload(context, path, 'change');
        })
            .on('unlink', (path) => {
            this.reload(context, path, 'unlink');
        });
    }
    configureDDBDataSource(config) {
        const ddbConfig = this.ddbClient.config;
        return (0, dynamo_db_1.configureDDBDataSource)(config, ddbConfig);
    }
    async getAppSyncAPI(context) {
        const currentMeta = await (0, utils_1.getAmplifyMeta)(context);
        const { api: apis = {} } = currentMeta;
        let appSyncApi = null;
        let name = null;
        Object.entries(apis).some((entry) => {
            if (entry[1].service === 'AppSync' && entry[1].providerPlugin === 'awscloudformation') {
                appSyncApi = entry[1];
                name = entry[0];
                return true;
            }
        });
        if (!name) {
            throw new Error('No AppSync API is added to the project');
        }
        return name;
    }
    async startDynamoDBLocalServer(context) {
        const dbPath = path.join(await (0, utils_1.getMockDataDirectory)(context), 'dynamodb');
        fs.ensureDirSync(dbPath);
        const mockConfig = await (0, mock_config_file_1.getMockConfig)(context);
        this.ddbEmulator = await dynamoEmulator.launch({
            dbPath,
            port: null,
            ...mockConfig,
        });
        return dynamoEmulator.getClient(this.ddbEmulator);
    }
    async getAPIBackendDirectory(context) {
        const { projectPath } = context.amplify.getEnvInfo();
        return path.join(projectPath, 'amplify', 'backend', 'api', this.apiName);
    }
    async getAPIParameterFilePath(context) {
        const backendPath = await this.getAPIBackendDirectory(context);
        return path.join(backendPath, 'parameters.json');
    }
    async loadAPIParameters(context) {
        const paramPath = await this.getAPIParameterFilePath(context);
        if (!fs.existsSync(paramPath)) {
            return {};
        }
        try {
            return JSON.parse(fs.readFileSync(paramPath, 'utf8'));
        }
        catch (e) {
            e.message = `Failed to load API parameters.json \n ${e.message}`;
            throw e;
        }
    }
    async getResolverTemplateDirectory(context) {
        const apiDirectory = await this.getAPIBackendDirectory(context);
        return apiDirectory;
    }
    async registerWatcher(context) {
        const watchDir = await this.getAPIBackendDirectory(context);
        return chokidar.watch(watchDir, {
            interval: 100,
            ignoreInitial: true,
            followSymlinks: false,
            ignored: '**/build/**',
            awaitWriteFinish: true,
        });
    }
    async generateFrontendExports(context, localAppSyncDetails) {
        const currentMeta = await (0, utils_1.getAmplifyMeta)(context);
        const override = currentMeta.api || {};
        if (localAppSyncDetails) {
            const appSyncApi = override[localAppSyncDetails.name] || { output: {} };
            override[localAppSyncDetails.name] = {
                service: 'AppSync',
                ...appSyncApi,
                output: {
                    ...appSyncApi.output,
                    GraphQLAPIEndpointOutput: localAppSyncDetails.endpoint,
                    projectRegion: localAppSyncDetails.region,
                    aws_appsync_authenticationType: localAppSyncDetails.securityType,
                    GraphQLAPIKeyOutput: localAppSyncDetails.GraphQLAPIKeyOutput,
                },
                testMode: localAppSyncDetails.testMode,
                lastPushTimeStamp: new Date(),
            };
        }
        this.configOverrideManager.addOverride('api', override);
        await this.configOverrideManager.generateOverriddenFrontendExports(context);
    }
}
exports.APITest = APITest;
//# sourceMappingURL=api.js.map