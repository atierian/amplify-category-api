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
exports.run = exports.name = void 0;
const path = __importStar(require("path"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const graphql_transformer_migrator_1 = require("@aws-amplify/graphql-transformer-migrator");
const check_appsync_api_migration_1 = require("../../provider-utils/awscloudformation/utils/check-appsync-api-migration");
const subcommand = 'migrate';
exports.name = subcommand;
const run = async (context) => {
    var _a, _b, _c;
    const apiNames = Object.entries(((_a = amplify_cli_core_1.stateManager.getMeta()) === null || _a === void 0 ? void 0 : _a.api) || {})
        .filter(([_, apiResource]) => apiResource.service === 'AppSync')
        .map(([name]) => name);
    if (apiNames.length === 0) {
        amplify_prompts_1.printer.info('No GraphQL API configured in the project. Only GraphQL APIs can be migrated. To add a GraphQL API run `amplify add api`.');
        return;
    }
    if (apiNames.length > 1) {
        amplify_prompts_1.printer.error('You have multiple GraphQL APIs in the project. Only one GraphQL API is allowed per project. Run `amplify remove api` to remove an API.');
        return;
    }
    const apiName = apiNames[0];
    const apiResourceDir = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), amplify_cli_core_1.AmplifyCategories.API, apiName);
    if (await (0, check_appsync_api_migration_1.checkAppsyncApiResourceMigration)(context, apiName, true)) {
        await context.amplify.invokePluginMethod(context, 'awscloudformation', undefined, 'compileSchema', [context, { forceCompile: true }]);
    }
    if ((_c = (_b = context.parameters) === null || _b === void 0 ? void 0 : _b.options) === null || _c === void 0 ? void 0 : _c.revert) {
        await (0, graphql_transformer_migrator_1.revertV2Migration)(apiResourceDir, amplify_cli_core_1.stateManager.getCurrentEnvName());
        return;
    }
    const transformerVersion = amplify_cli_core_1.FeatureFlags.getNumber('graphqltransformer.transformerversion');
    const improvePluralization = amplify_cli_core_1.FeatureFlags.getBoolean('graphqltransformer.improvepluralization');
    await (0, graphql_transformer_migrator_1.attemptV2TransformerMigration)(apiResourceDir, apiName, { transformerVersion, improvePluralization }, amplify_cli_core_1.stateManager.getCurrentEnvName());
};
exports.run = run;
//# sourceMappingURL=migrate.js.map