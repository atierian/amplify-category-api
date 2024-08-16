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
exports.generateRDSSchema = exports.writeSchemaFile = void 0;
const graphql_transformer_core_1 = require("@aws-amplify/graphql-transformer-core");
const fs = __importStar(require("fs-extra"));
const graphql_schema_generator_1 = require("@aws-amplify/graphql-schema-generator");
const rds_input_utils_1 = require("./rds-input-utils");
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const database_resources_1 = require("./rds-resources/database-resources");
const graphql_1 = require("graphql");
const writeSchemaFile = (pathToSchemaFile, schemaString) => {
    fs.ensureFileSync(pathToSchemaFile);
    fs.writeFileSync(pathToSchemaFile, schemaString);
};
exports.writeSchemaFile = writeSchemaFile;
const generateRDSSchema = async (context, databaseConfig, pathToSchemaFile) => {
    const { amplify } = context;
    const { envName } = amplify.getEnvInfo();
    const schema = await buildSchemaFromConnection(envName, databaseConfig);
    const existingSchema = await (0, rds_input_utils_1.readRDSSchema)(pathToSchemaFile);
    const existingSchemaDocument = parseSchema(existingSchema, pathToSchemaFile);
    const includeAuthRule = false;
    return (0, graphql_schema_generator_1.renderSchema)(schema, databaseConfig, includeAuthRule, existingSchemaDocument);
};
exports.generateRDSSchema = generateRDSSchema;
const retryWithVpcLambda = async (envName, databaseConfig, adapter) => {
    const meta = amplify_cli_core_1.stateManager.getMeta();
    const { AmplifyAppId, Region } = meta.providers.awscloudformation;
    const vpc = await (0, graphql_schema_generator_1.getHostVpc)(databaseConfig.host, Region);
    if (vpc) {
        const shouldTryVpc = await amplify_prompts_1.prompter.confirmContinue(`Unable to connect to the database from this machine. Would you like to try from VPC '${vpc.vpcId}'? (This will take several minutes):`);
        if (shouldTryVpc) {
            const schemaInspectorLambda = (0, database_resources_1.getVpcMetadataLambdaName)(AmplifyAppId, envName);
            await (0, graphql_schema_generator_1.provisionSchemaInspectorLambda)(schemaInspectorLambda, vpc, Region);
            adapter.useVpc(schemaInspectorLambda, Region);
            await adapter.initialize();
            return true;
        }
    }
    return false;
};
const parseSchema = (schemaContent, pathToSchemaFile) => {
    if (!schemaContent) {
        return;
    }
    try {
        const document = (0, graphql_1.parse)(schemaContent);
        if (!document) {
            return;
        }
        return document;
    }
    catch (err) {
        throw new Error(`The schema file at ${pathToSchemaFile} is not a valid GraphQL document. ${err === null || err === void 0 ? void 0 : err.message}`);
    }
};
const buildSchemaFromConnection = async (envName, databaseConfig) => {
    let adapter;
    let schema;
    const UNABLE_TO_CONNECT_MESSAGE = 'Failed to connect to the specified RDS Data Source. Check the connection details in the schema and re-try. Use "amplify api update-secrets" to update the user credentials.';
    switch (databaseConfig.engine) {
        case graphql_transformer_core_1.ImportedRDSType.MYSQL:
            adapter = new graphql_schema_generator_1.MySQLDataSourceAdapter(databaseConfig);
            schema = new graphql_schema_generator_1.Schema(new graphql_schema_generator_1.Engine('MySQL'));
            break;
        case graphql_transformer_core_1.ImportedRDSType.POSTGRESQL:
            adapter = new graphql_schema_generator_1.PostgresDataSourceAdapter(databaseConfig);
            schema = new graphql_schema_generator_1.Schema(new graphql_schema_generator_1.Engine('Postgres'));
            break;
        default:
            throw new amplify_cli_core_1.AmplifyError('UserInputError', { message: 'Only MySQL and Postgres Data Sources are supported.' });
    }
    try {
        await adapter.initialize();
    }
    catch (error) {
        if (error.code === 'ETIMEDOUT' || error.name === 'KnexTimeoutError') {
            const canConnectFromVpc = await retryWithVpcLambda(envName, databaseConfig, adapter);
            if (!canConnectFromVpc) {
                throw new amplify_cli_core_1.AmplifyError('UserInputError', {
                    message: UNABLE_TO_CONNECT_MESSAGE,
                });
            }
        }
        else {
            throw error;
        }
    }
    const models = adapter.getModels();
    adapter.cleanup();
    models.forEach((m) => schema.addModel(m));
    return schema;
};
//# sourceMappingURL=graphql-schema-utils.js.map