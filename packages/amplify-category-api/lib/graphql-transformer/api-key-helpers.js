"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasApiKey = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
async function hasApiKey(context) {
    const apiKeyConfig = await amplify_cli_core_1.CloudformationProviderFacade.getApiKeyConfig(context);
    return !!apiKeyConfig && !!(apiKeyConfig === null || apiKeyConfig === void 0 ? void 0 : apiKeyConfig.apiKeyExpirationDays);
}
exports.hasApiKey = hasApiKey;
//# sourceMappingURL=api-key-helpers.js.map