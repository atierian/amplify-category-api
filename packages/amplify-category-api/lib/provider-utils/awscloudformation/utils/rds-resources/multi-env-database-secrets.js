"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureMultiEnvDBSecrets = void 0;
const database_resources_1 = require("../../utils/rds-resources/database-resources");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const configureMultiEnvDBSecrets = async (context, secretsKey, apiName, envInfo) => {
    if (!envInfo.isNewEnv) {
        return;
    }
    const secrets = await (0, database_resources_1.getExistingConnectionSecrets)(context, secretsKey, apiName, envInfo.sourceEnv);
    if (!secrets) {
        amplify_prompts_1.printer.warn(`Could not copy over the user secrets for imported database. Run "amplify api update-secrets" to set them for the current environment.`);
        return;
    }
    await (0, database_resources_1.storeConnectionSecrets)(context, secrets, apiName, secretsKey);
    return;
};
exports.configureMultiEnvDBSecrets = configureMultiEnvDBSecrets;
//# sourceMappingURL=multi-env-database-secrets.js.map