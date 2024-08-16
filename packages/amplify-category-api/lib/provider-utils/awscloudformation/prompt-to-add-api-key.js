"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptToAddApiKey = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const appSync_walkthrough_1 = require("./service-walkthroughs/appSync-walkthrough");
const auth_config_to_app_sync_auth_type_bi_di_mapper_1 = require("./utils/auth-config-to-app-sync-auth-type-bi-di-mapper");
const cfn_api_artifact_handler_1 = require("./cfn-api-artifact-handler");
async function promptToAddApiKey(context) {
    if (await amplify_prompts_1.prompter.confirmContinue('Would you like to create an API Key?')) {
        const apiKeyConfig = await (0, appSync_walkthrough_1.askApiKeyQuestions)();
        const authConfig = [apiKeyConfig];
        await (0, cfn_api_artifact_handler_1.getCfnApiArtifactHandler)(context).updateArtifacts({
            version: 1,
            serviceModification: {
                serviceName: 'AppSync',
                additionalAuthTypes: authConfig.map(auth_config_to_app_sync_auth_type_bi_di_mapper_1.authConfigToAppSyncAuthType),
            },
        }, {
            skipCompile: true,
        });
        return apiKeyConfig;
    }
}
exports.promptToAddApiKey = promptToAddApiKey;
//# sourceMappingURL=prompt-to-add-api-key.js.map