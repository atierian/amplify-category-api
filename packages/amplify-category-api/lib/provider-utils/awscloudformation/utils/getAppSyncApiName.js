"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAppSyncApiResourceName = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const getAppSyncApiResourceName = async (context) => {
    const { allResources } = await context.amplify.getResourceStatus();
    const apiResource = allResources.filter((resource) => resource.service === amplify_cli_core_1.AmplifySupportedService.APPSYNC);
    let apiResourceName;
    if (apiResource.length > 0) {
        const resource = apiResource[0];
        apiResourceName = resource.resourceName;
    }
    else {
        throw new amplify_cli_core_1.AmplifyError('NotImplementedError', {
            message: `${amplify_cli_core_1.AmplifySupportedService.APPSYNC} API does not exist`,
            resolution: 'To add an api, use amplify add api',
        });
    }
    return apiResourceName;
};
exports.getAppSyncApiResourceName = getAppSyncApiResourceName;
//# sourceMappingURL=getAppSyncApiName.js.map