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
const import_appsync_api_walkthrough_1 = require("../../provider-utils/awscloudformation/service-walkthroughs/import-appsync-api-walkthrough");
const amplify_meta_utils_1 = require("../../provider-utils/awscloudformation/utils/amplify-meta-utils");
const graphql_schema_utils_1 = require("../../provider-utils/awscloudformation/utils/graphql-schema-utils");
const category_constants_1 = require("../../category-constants");
const subcommand = 'import';
exports.name = subcommand;
const run = async (context) => {
    amplify_prompts_1.printer.warn(category_constants_1.PREVIEW_BANNER);
    const importAppSyncAPIWalkInputs = await (0, import_appsync_api_walkthrough_1.importAppSyncAPIWalkthrough)(context);
    if (importAppSyncAPIWalkInputs === null || importAppSyncAPIWalkInputs === void 0 ? void 0 : importAppSyncAPIWalkInputs.dataSourceConfig) {
        const apiResourceDir = (0, amplify_meta_utils_1.getAPIResourceDir)(importAppSyncAPIWalkInputs.apiName);
        fs_extra_1.default.ensureDirSync(apiResourceDir);
        const pathToSchemaFile = path.join(apiResourceDir, graphql_transformer_core_1.SQL_SCHEMA_FILE_NAME);
        const schemaString = await (0, graphql_schema_utils_1.generateRDSSchema)(context, importAppSyncAPIWalkInputs.dataSourceConfig, pathToSchemaFile);
        (0, graphql_schema_utils_1.writeSchemaFile)(pathToSchemaFile, schemaString);
        amplify_prompts_1.printer.info(`Successfully imported the database schema into ${pathToSchemaFile}.`);
    }
};
exports.run = run;
//# sourceMappingURL=import.js.map