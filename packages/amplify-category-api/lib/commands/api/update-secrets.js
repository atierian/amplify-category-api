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
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const fs_extra_1 = __importDefault(require("fs-extra"));
const graphql_transformer_core_1 = require("@aws-amplify/graphql-transformer-core");
const appSync_rds_db_config_1 = require("../../provider-utils/awscloudformation/service-walkthroughs/appSync-rds-db-config");
const amplify_meta_utils_1 = require("../../provider-utils/awscloudformation/utils/amplify-meta-utils");
const database_resources_1 = require("../../provider-utils/awscloudformation/utils/rds-resources/database-resources");
const category_constants_1 = require("../../category-constants");
const graphql_1 = require("graphql");
const rds_input_utils_1 = require("../../provider-utils/awscloudformation/utils/rds-input-utils");
const subcommand = 'update-secrets';
exports.name = subcommand;
const run = async (context) => {
    amplify_prompts_1.printer.warn(category_constants_1.PREVIEW_BANNER);
    const apiName = (0, amplify_meta_utils_1.getAppSyncAPIName)();
    const apiResourceDir = (0, amplify_meta_utils_1.getAPIResourceDir)(apiName);
    const pathToSchemaFile = path.join(apiResourceDir, graphql_transformer_core_1.SQL_SCHEMA_FILE_NAME);
    if (!fs_extra_1.default.existsSync(pathToSchemaFile)) {
        amplify_prompts_1.printer.info('No imported Data Sources to update the secrets.');
        return;
    }
    const importedSchema = (0, graphql_1.parse)(fs_extra_1.default.readFileSync(pathToSchemaFile, 'utf8'));
    const engine = await (0, rds_input_utils_1.getEngineInput)(importedSchema);
    const secretsKey = await (0, database_resources_1.getSecretsKey)();
    const databaseConfig = await (0, appSync_rds_db_config_1.databaseConfigurationInputWalkthrough)(engine);
    await (0, database_resources_1.storeConnectionSecrets)(context, databaseConfig, apiName, secretsKey);
    amplify_prompts_1.printer.info('Successfully updated the secrets for the database.');
};
exports.run = run;
//# sourceMappingURL=update-secrets.js.map