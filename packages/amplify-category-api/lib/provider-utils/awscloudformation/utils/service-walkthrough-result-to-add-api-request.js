"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceWalkthroughResultToAddApiRequest = void 0;
const resolver_config_to_conflict_resolution_bi_di_mapper_1 = require("./resolver-config-to-conflict-resolution-bi-di-mapper");
const auth_config_to_app_sync_auth_type_bi_di_mapper_1 = require("./auth-config-to-app-sync-auth-type-bi-di-mapper");
const serviceWalkthroughResultToAddApiRequest = (result) => ({
    version: 1,
    serviceConfiguration: {
        serviceName: 'AppSync',
        apiName: result.answers.apiName,
        transformSchema: result.schemaContent,
        defaultAuthType: (0, auth_config_to_app_sync_auth_type_bi_di_mapper_1.authConfigToAppSyncAuthType)(result.output.authConfig.defaultAuthentication),
        additionalAuthTypes: (result.output.authConfig.additionalAuthenticationProviders || []).map(auth_config_to_app_sync_auth_type_bi_di_mapper_1.authConfigToAppSyncAuthType),
        conflictResolution: (0, resolver_config_to_conflict_resolution_bi_di_mapper_1.resolverConfigToConflictResolution)(result.resolverConfig),
    },
});
exports.serviceWalkthroughResultToAddApiRequest = serviceWalkthroughResultToAddApiRequest;
//# sourceMappingURL=service-walkthrough-result-to-add-api-request.js.map