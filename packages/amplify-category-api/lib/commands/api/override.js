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
const category_constants_1 = require("../../category-constants");
const apigw_input_state_1 = require("../../provider-utils/awscloudformation/apigw-input-state");
const cdk_stack_builder_1 = require("../../provider-utils/awscloudformation/cdk-stack-builder");
const check_appsync_api_migration_1 = require("../../provider-utils/awscloudformation/utils/check-appsync-api-migration");
exports.name = 'override';
const run = async (context) => {
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    const apiResources = [];
    if (amplifyMeta[amplify_cli_core_1.AmplifyCategories.API]) {
        Object.keys(amplifyMeta[amplify_cli_core_1.AmplifyCategories.API]).forEach((resourceName) => {
            apiResources.push(resourceName);
        });
    }
    if (apiResources.length === 0) {
        const errMessage = 'No resources to override. You need to add a resource.';
        amplify_prompts_1.printer.error(errMessage);
        return;
    }
    let selectedResourceName = apiResources[0];
    if (apiResources.length > 1) {
        selectedResourceName = await amplify_prompts_1.prompter.pick('Which resource would you like to add overrides for?', apiResources);
    }
    const { service } = amplifyMeta[amplify_cli_core_1.AmplifyCategories.API][selectedResourceName];
    const destPath = amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, amplify_cli_core_1.AmplifyCategories.API, selectedResourceName);
    const srcPath = path.join(__dirname, '..', '..', '..', 'resources', 'awscloudformation', 'overrides-resource', service === amplify_cli_core_1.AmplifySupportedService.APIGW ? 'APIGW' : service);
    if (service === amplify_cli_core_1.AmplifySupportedService.APPSYNC) {
        const transformerVersion = await amplify_cli_core_1.ApiCategoryFacade.getTransformerVersion(context);
        if (transformerVersion === 2 && (await (0, check_appsync_api_migration_1.checkAppsyncApiResourceMigration)(context, selectedResourceName, false))) {
            await context.amplify.invokePluginMethod(context, 'awscloudformation', undefined, 'compileSchema', [context, { forceCompile: true }]);
            await (0, amplify_cli_core_1.generateOverrideSkeleton)(context, srcPath, destPath);
        }
        else {
            amplify_prompts_1.printer.warn('The GraphQL API is using transformer version 1. Run `amplify migrate api` to upgrade to transformer version 2 and rerun amplify override api to enable override functionality for API');
        }
    }
    else if (service === amplify_cli_core_1.AmplifySupportedService.APIGW) {
        const apigwInputState = new apigw_input_state_1.ApigwInputState(context, selectedResourceName);
        if (!apigwInputState.cliInputsFileExists()) {
            if (selectedResourceName === category_constants_1.ADMIN_QUERIES_NAME) {
                const { dependsOn } = amplifyMeta[amplify_cli_core_1.AmplifyCategories.API][selectedResourceName];
                if (!Array.isArray(dependsOn) || dependsOn.length === 0) {
                    throw new Error(`Invalid dependsOn entry found in amplify-meta.json for "${category_constants_1.ADMIN_QUERIES_NAME}"`);
                }
                const getResourceNameFromDependsOn = (categoryName, dependsOn) => dependsOn.filter((entry) => entry.category === categoryName)[0].resourceName;
                const props = {
                    apiName: selectedResourceName,
                    authResourceName: getResourceNameFromDependsOn(amplify_cli_core_1.AmplifyCategories.AUTH, dependsOn),
                    functionName: getResourceNameFromDependsOn(amplify_cli_core_1.AmplifyCategories.FUNCTION, dependsOn),
                    dependsOn: dependsOn,
                };
                await apigwInputState.migrateAdminQueries(props);
            }
            else {
                await apigwInputState.migrateApigwResource(selectedResourceName);
                const stackGenerator = new cdk_stack_builder_1.ApigwStackTransform(context, selectedResourceName);
                await stackGenerator.transform();
            }
        }
        await (0, amplify_cli_core_1.generateOverrideSkeleton)(context, srcPath, destPath);
    }
};
exports.run = run;
//# sourceMappingURL=override.js.map