"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importTransformerModule = exports.getTransformerFactoryV1 = void 0;
const path_1 = __importDefault(require("path"));
const graphql_dynamodb_transformer_1 = require("graphql-dynamodb-transformer");
const graphql_auth_transformer_1 = require("graphql-auth-transformer");
const graphql_connection_transformer_1 = require("graphql-connection-transformer");
const graphql_elasticsearch_transformer_1 = require("graphql-elasticsearch-transformer");
const graphql_versioned_transformer_1 = require("graphql-versioned-transformer");
const graphql_function_transformer_1 = require("graphql-function-transformer");
const graphql_http_transformer_1 = require("graphql-http-transformer");
const graphql_predictions_transformer_1 = require("graphql-predictions-transformer");
const graphql_key_transformer_1 = require("graphql-key-transformer");
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const graphql_transformer_core_1 = require("graphql-transformer-core");
const import_from_1 = __importDefault(require("import-from"));
const import_global_1 = __importDefault(require("import-global"));
const PROVIDER_NAME = 'awscloudformation';
const getTransformerFactoryV1 = (context, resourceDir, authConfig) => async (addSearchableTransformer, storageConfig) => {
    var _a, _b;
    const transformerList = [
        new graphql_dynamodb_transformer_1.DynamoDBModelTransformer(),
        new graphql_versioned_transformer_1.VersionedModelTransformer(),
        new graphql_function_transformer_1.FunctionTransformer(),
        new graphql_http_transformer_1.HttpTransformer(),
        new graphql_key_transformer_1.KeyTransformer(),
        new graphql_connection_transformer_1.ModelConnectionTransformer(),
        new graphql_predictions_transformer_1.PredictionsTransformer(storageConfig),
    ];
    if (addSearchableTransformer) {
        transformerList.push(new graphql_elasticsearch_transformer_1.SearchableModelTransformer());
    }
    const customTransformersConfig = await (0, graphql_transformer_core_1.readTransformerConfiguration)(resourceDir);
    const customTransformers = (customTransformersConfig && customTransformersConfig.transformers ? customTransformersConfig.transformers : [])
        .map(exports.importTransformerModule)
        .map((imported) => {
        const CustomTransformer = imported.default;
        if (typeof CustomTransformer === 'function')
            return new CustomTransformer();
        if (typeof CustomTransformer === 'object')
            return CustomTransformer;
        throw new Error("Custom Transformers' default export must be a function or an object");
    })
        .filter((customTransformer) => customTransformer);
    if (customTransformers.length > 0) {
        transformerList.push(...customTransformers);
    }
    let amplifyAdminEnabled = false;
    try {
        const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
        const appId = (_b = (_a = amplifyMeta === null || amplifyMeta === void 0 ? void 0 : amplifyMeta.providers) === null || _a === void 0 ? void 0 : _a[PROVIDER_NAME]) === null || _b === void 0 ? void 0 : _b.AmplifyAppId;
        const res = await amplify_cli_core_1.CloudformationProviderFacade.isAmplifyAdminApp(context, appId);
        amplifyAdminEnabled = res.isAdminApp;
    }
    catch (err) {
    }
    transformerList.push(new graphql_auth_transformer_1.ModelAuthTransformer({ authConfig, addAwsIamAuthInOutputSchema: amplifyAdminEnabled }));
    return transformerList;
};
exports.getTransformerFactoryV1 = getTransformerFactoryV1;
const importTransformerModule = (transformerName) => {
    const fileUrlMatch = /^file:\/\/(.*)\s*$/m.exec(transformerName);
    const modulePath = fileUrlMatch ? fileUrlMatch[1] : transformerName;
    if (!modulePath) {
        throw new Error(`Invalid value specified for transformer: '${transformerName}'`);
    }
    let importedModule;
    const tempModulePath = modulePath.toString();
    try {
        if (path_1.default.isAbsolute(tempModulePath)) {
            importedModule = require(modulePath);
        }
        else {
            const projectRootPath = amplify_cli_core_1.pathManager.findProjectRoot();
            const projectNodeModules = path_1.default.join(projectRootPath, 'node_modules');
            try {
                importedModule = (0, import_from_1.default)(projectNodeModules, modulePath);
            }
            catch (_a) {
            }
            if (!importedModule) {
                importedModule = (0, import_global_1.default)(modulePath);
            }
        }
        return importedModule;
    }
    catch (error) {
        amplify_prompts_1.printer.error(`Unable to import custom transformer module(${modulePath}).`);
        amplify_prompts_1.printer.error(`You may fix this error by editing transformers at ${path_1.default.join(transformerName, graphql_transformer_core_1.TRANSFORM_CONFIG_FILE_NAME)}`);
        throw error;
    }
};
exports.importTransformerModule = importTransformerModule;
//# sourceMappingURL=transformer-factory.js.map