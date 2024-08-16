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
exports.run = exports.name = void 0;
const path = __importStar(require("path"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const graphql_transformer_core_1 = require("@aws-amplify/graphql-transformer-core");
const graphql_schema_generator_1 = require("@aws-amplify/graphql-schema-generator");
const amplify_meta_utils_1 = require("../../provider-utils/awscloudformation/utils/amplify-meta-utils");
const database_resources_1 = require("../../provider-utils/awscloudformation/utils/rds-resources/database-resources");
const graphql_schema_utils_1 = require("../../provider-utils/awscloudformation/utils/graphql-schema-utils");
const category_constants_1 = require("../../category-constants");
const graphql_1 = require("graphql");
const rds_input_utils_1 = require("../../provider-utils/awscloudformation/utils/rds-input-utils");
const subcommand = 'generate-schema';
exports.name = subcommand;
const run = async (context) => {
    var _a, _b, _c, _d, _e, _f;
    const transformerVersion = await amplify_cli_core_1.ApiCategoryFacade.getTransformerVersion(context);
    if (transformerVersion !== 2) {
        throw new amplify_cli_core_1.AmplifyError('InvalidDirectiveError', {
            message: 'Imported SQL schema can only generate a GraphQL schema with the version 2 transformer.',
        });
    }
    const sqlSchema = (_b = (_a = context.parameters) === null || _a === void 0 ? void 0 : _a.options) === null || _b === void 0 ? void 0 : _b['sql-schema'];
    const engineType = (_d = (_c = context.parameters) === null || _c === void 0 ? void 0 : _c.options) === null || _d === void 0 ? void 0 : _d['engine-type'];
    const out = (_f = (_e = context.parameters) === null || _e === void 0 ? void 0 : _e.options) === null || _f === void 0 ? void 0 : _f.out;
    if (sqlSchema || engineType || out) {
        if (!(sqlSchema && engineType && out)) {
            if (!sqlSchema) {
                throw new amplify_cli_core_1.AmplifyError('UserInputError', { message: 'A SQL schema must be provided with --sql-schema' });
            }
            if (!engineType) {
                throw new amplify_cli_core_1.AmplifyError('UserInputError', { message: 'An engine type must be provided with --engine-type' });
            }
            if (!out) {
                throw new amplify_cli_core_1.AmplifyError('UserInputError', { message: 'An output path must be provided with --out' });
            }
        }
        if (!Object.values(graphql_transformer_core_1.ImportedRDSType).includes(engineType)) {
            throw new amplify_cli_core_1.AmplifyError('UserInputError', { message: `${engineType} is not a supported engine type.` });
        }
        if (!fs_extra_1.default.existsSync(sqlSchema)) {
            throw new amplify_cli_core_1.AmplifyError('UserInputError', { message: `SQL schema file ${sqlSchema} does not exists.` });
        }
        const schema = await (0, graphql_schema_generator_1.graphqlSchemaFromSQLSchema)(fs_extra_1.default.readFileSync(sqlSchema, 'utf8'), engineType);
        (0, graphql_schema_utils_1.writeSchemaFile)(out, schema);
    }
    else {
        amplify_prompts_1.printer.warn(category_constants_1.PREVIEW_BANNER);
        const apiName = (0, amplify_meta_utils_1.getAppSyncAPIName)();
        const apiResourceDir = (0, amplify_meta_utils_1.getAPIResourceDir)(apiName);
        const pathToSchemaFile = path.join(apiResourceDir, graphql_transformer_core_1.SQL_SCHEMA_FILE_NAME);
        if (!fs_extra_1.default.existsSync(pathToSchemaFile)) {
            throw new amplify_cli_core_1.AmplifyError('UserInputError', { message: 'No imported Data Sources to Generate GraphQL Schema.' });
        }
        const importedSchema = (0, graphql_1.parse)(fs_extra_1.default.readFileSync(pathToSchemaFile, 'utf8'));
        const engine = await (0, rds_input_utils_1.getEngineInput)(importedSchema);
        const secretsKey = (0, database_resources_1.getSecretsKey)();
        const database = await (0, database_resources_1.getDatabaseName)(context, apiName, secretsKey);
        if (!database) {
            throw new amplify_cli_core_1.AmplifyError('UserInputError', {
                message: 'Cannot fetch the imported database name to generate the schema. Use "amplify api update-secrets" to update the database information.',
            });
        }
        const { secrets, storeSecrets } = await (0, database_resources_1.getConnectionSecrets)(context, secretsKey, engine);
        const databaseConfig = {
            ...secrets,
            engine,
        };
        const schemaString = await (0, graphql_schema_utils_1.generateRDSSchema)(context, databaseConfig, pathToSchemaFile);
        if (storeSecrets) {
            await (0, database_resources_1.storeConnectionSecrets)(context, secrets, apiName, secretsKey);
        }
        (0, graphql_schema_utils_1.writeSchemaFile)(pathToSchemaFile, schemaString);
        if (lodash_1.default.isEmpty(schemaString)) {
            amplify_prompts_1.printer.warn('If your schema file is empty, it is likely that your database has no tables.');
        }
        amplify_prompts_1.printer.info(`Successfully imported the schema definition for ${databaseConfig.database} database into ${pathToSchemaFile}`);
    }
};
exports.run = run;
//# sourceMappingURL=generate-schema.js.map