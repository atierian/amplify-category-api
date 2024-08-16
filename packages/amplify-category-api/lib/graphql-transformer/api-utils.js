"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchablePushChecks = void 0;
const amplify_environment_parameters_1 = require("@aws-amplify/amplify-environment-parameters");
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const graphql_transformer_common_1 = require("graphql-transformer-common");
async function searchablePushChecks(context, map, apiName) {
    var _a, _b;
    const searchableModelTypes = Object.keys(map).filter((type) => map[type].includes('searchable') && map[type].includes('model'));
    if (searchableModelTypes.length) {
        const apiParameterManager = (await (0, amplify_environment_parameters_1.ensureEnvParamManager)()).instance.getResourceParamManager(amplify_cli_core_1.AmplifyCategories.API, apiName);
        const getInstanceType = (instanceTypeParam) => apiParameterManager.getParam(instanceTypeParam);
        const instanceType = (_b = (_a = getInstanceType(graphql_transformer_common_1.ResourceConstants.PARAMETERS.OpenSearchInstanceType)) !== null && _a !== void 0 ? _a : getInstanceType(graphql_transformer_common_1.ResourceConstants.PARAMETERS.ElasticsearchInstanceType)) !== null && _b !== void 0 ? _b : 't2.small.elasticsearch';
        if (instanceType === 't2.small.elasticsearch' || instanceType === 't3.small.elasticsearch') {
            const version = await amplify_cli_core_1.ApiCategoryFacade.getTransformerVersion(context);
            const docLink = (0, amplify_cli_core_1.getGraphQLTransformerOpenSearchProductionDocLink)(version);
            amplify_prompts_1.printer.warn(`Your instance type for OpenSearch is ${instanceType}, you may experience performance issues or data loss. Consider reconfiguring with the instructions here ${docLink}`);
        }
    }
}
exports.searchablePushChecks = searchablePushChecks;
//# sourceMappingURL=api-utils.js.map