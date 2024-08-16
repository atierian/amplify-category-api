"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printApiKeyWarnings = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const printApiKeyWarnings = (oldConfigHadApiKey, newConfigHasApiKey) => {
    if (oldConfigHadApiKey && !newConfigHasApiKey) {
        amplify_prompts_1.printer.warn('The API_KEY auth type has been removed from the API.');
        amplify_prompts_1.printer.warn('If other resources depend on this API, run "amplify update <category>" and reselect this API to remove the dependency on the API key.');
        amplify_prompts_1.printer.warn('This must be done before running "amplify push" to prevent a push failure');
    }
    if (!oldConfigHadApiKey && newConfigHasApiKey) {
        amplify_prompts_1.printer.warn('The API_KEY auth type has been added to the API.');
        amplify_prompts_1.printer.warn('If other resources depend on this API and need access to the API key, run "amplify update <category>" and reselect this API as a dependency to add the API key dependency.');
    }
};
exports.printApiKeyWarnings = printApiKeyWarnings;
//# sourceMappingURL=print-api-key-warnings.js.map