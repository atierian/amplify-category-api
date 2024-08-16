"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResolverConfig = void 0;
const appsync_api_input_state_1 = require("../api-input-manager/appsync-api-input-state");
const resolver_config_to_conflict_resolution_bi_di_mapper_1 = require("./resolver-config-to-conflict-resolution-bi-di-mapper");
const getResolverConfig = async (context, resourceName) => {
    const cliState = new appsync_api_input_state_1.AppsyncApiInputState(context, resourceName);
    if (cliState.cliInputFileExists()) {
        const appsyncInputs = cliState.getCLIInputPayload().serviceConfiguration;
        return (0, resolver_config_to_conflict_resolution_bi_di_mapper_1.conflictResolutionToResolverConfig)(appsyncInputs.conflictResolution);
    }
};
exports.getResolverConfig = getResolverConfig;
//# sourceMappingURL=get-appsync-resolver-config.js.map