"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthConfig = void 0;
const appsync_api_input_state_1 = require("../api-input-manager/appsync-api-input-state");
const auth_config_to_app_sync_auth_type_bi_di_mapper_1 = require("./auth-config-to-app-sync-auth-type-bi-di-mapper");
const getAuthConfig = async (context, resourceName) => {
    const cliState = new appsync_api_input_state_1.AppsyncApiInputState(context, resourceName);
    if (cliState.cliInputFileExists()) {
        const appsyncInputs = cliState.getCLIInputPayload().serviceConfiguration;
        return {
            defaultAuthentication: (0, auth_config_to_app_sync_auth_type_bi_di_mapper_1.appSyncAuthTypeToAuthConfig)(appsyncInputs.defaultAuthType),
            additionalAuthenticationProviders: (appsyncInputs.additionalAuthTypes || []).map(auth_config_to_app_sync_auth_type_bi_di_mapper_1.appSyncAuthTypeToAuthConfig),
        };
    }
};
exports.getAuthConfig = getAuthConfig;
//# sourceMappingURL=get-appsync-auth-config.js.map