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
exports.formatEngineName = exports.writeDefaultGraphQLSchema = exports.importAppSyncAPIWalkthrough = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const graphql_transformer_core_1 = require("@aws-amplify/graphql-transformer-core");
const database_resources_1 = require("../utils/rds-resources/database-resources");
const graphql_schema_generator_1 = require("@aws-amplify/graphql-schema-generator");
const amplify_meta_utils_1 = require("../utils/amplify-meta-utils");
const graphql_schema_utils_1 = require("../utils/graphql-schema-utils");
const dynamic_imports_1 = require("../utils/dynamic-imports");
const service_walkthrough_result_to_add_api_request_1 = require("../utils/service-walkthrough-result-to-add-api-request");
const cfn_api_artifact_handler_1 = require("../cfn-api-artifact-handler");
const appSync_walkthrough_1 = require("./appSync-walkthrough");
const appSync_rds_db_config_1 = require("./appSync-rds-db-config");
const service = 'AppSync';
const importAppSyncAPIWalkthrough = async (context) => {
    let apiName;
    const existingAPIs = (0, amplify_meta_utils_1.getAppSyncAPINames)();
    if ((existingAPIs === null || existingAPIs === void 0 ? void 0 : existingAPIs.length) > 0) {
        apiName = existingAPIs[0];
    }
    else {
        const serviceMetadata = await (0, dynamic_imports_1.serviceMetadataFor)(service);
        const walkthroughResult = await (0, appSync_walkthrough_1.serviceApiInputWalkthrough)(context, serviceMetadata);
        const importAPIRequest = (0, service_walkthrough_result_to_add_api_request_1.serviceWalkthroughResultToAddApiRequest)(walkthroughResult);
        apiName = await (0, cfn_api_artifact_handler_1.getCfnApiArtifactHandler)(context).createArtifacts(importAPIRequest);
    }
    const apiResourceDir = (0, amplify_meta_utils_1.getAPIResourceDir)(apiName);
    const pathToSchemaFile = path.join(apiResourceDir, graphql_transformer_core_1.SQL_SCHEMA_FILE_NAME);
    const secretsKey = await (0, database_resources_1.getSecretsKey)();
    if (fs.pathExistsSync(pathToSchemaFile)) {
        amplify_prompts_1.printer.error('Imported Database schema already exists. Use "amplify api generate-schema" to fetch the latest updates to schema.');
        return {
            apiName: apiName,
        };
    }
    const engine = await promptDatabaseEngine();
    const databaseConfig = await (0, appSync_rds_db_config_1.databaseConfigurationInputWalkthrough)(engine);
    await (0, exports.writeDefaultGraphQLSchema)(context, pathToSchemaFile, databaseConfig);
    await (0, database_resources_1.storeConnectionSecrets)(context, databaseConfig, apiName, secretsKey);
    return {
        apiName,
        dataSourceConfig: databaseConfig,
    };
};
exports.importAppSyncAPIWalkthrough = importAppSyncAPIWalkthrough;
const promptDatabaseEngine = async () => {
    const engine = await amplify_prompts_1.prompter.pick('Select the database type:', [
        {
            name: 'MySQL',
            value: graphql_transformer_core_1.ImportedRDSType.MYSQL,
        },
        {
            name: 'PostgreSQL',
            value: graphql_transformer_core_1.ImportedRDSType.POSTGRESQL,
        },
    ]);
    return engine;
};
const writeDefaultGraphQLSchema = async (context, pathToSchemaFile, databaseConfig) => {
    const dataSourceType = databaseConfig === null || databaseConfig === void 0 ? void 0 : databaseConfig.engine;
    if (Object.values(graphql_transformer_core_1.ImportedRDSType).includes(dataSourceType)) {
        const includeAuthRule = false;
        const globalAmplifyInputTemplate = await (0, graphql_schema_generator_1.constructDefaultGlobalAmplifyInput)(databaseConfig.engine, includeAuthRule);
        (0, graphql_schema_utils_1.writeSchemaFile)(pathToSchemaFile, globalAmplifyInputTemplate);
    }
    else {
        throw new Error(`Data source type ${dataSourceType} is not supported.`);
    }
};
exports.writeDefaultGraphQLSchema = writeDefaultGraphQLSchema;
const formatEngineName = (engine) => {
    switch (engine) {
        case graphql_transformer_core_1.ImportedRDSType.MYSQL:
            return 'MySQL';
        case graphql_transformer_core_1.ImportedRDSType.POSTGRESQL:
            return 'PostgreSQL';
        default:
            throw new Error(`Unsupported database engine: ${engine}`);
    }
};
exports.formatEngineName = formatEngineName;
//# sourceMappingURL=import-appsync-api-walkthrough.js.map