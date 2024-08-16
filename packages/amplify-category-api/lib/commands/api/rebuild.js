"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.name = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const subcommand = 'rebuild';
exports.name = subcommand;
const rebuild = true;
const run = async (context) => {
    var _a;
    if (!amplify_cli_core_1.FeatureFlags.getBoolean('graphqlTransformer.enableIterativeGSIUpdates')) {
        amplify_prompts_1.printer.error('Iterative GSI Updates must be enabled to rebuild an API. See https://docs.amplify.aws/cli/reference/feature-flags/');
        return;
    }
    const apiNames = Object.entries(((_a = amplify_cli_core_1.stateManager.getMeta()) === null || _a === void 0 ? void 0 : _a.api) || {})
        .filter(([_, apiResource]) => apiResource.service === 'AppSync')
        .map(([name]) => name);
    if (apiNames.length === 0) {
        amplify_prompts_1.printer.info('No GraphQL API configured in the project. Only GraphQL APIs can be rebuilt. To add a GraphQL API run `amplify add api`.');
        return;
    }
    if (apiNames.length > 1) {
        amplify_prompts_1.printer.error('You have multiple GraphQL APIs in the project. Only one GraphQL API is allowed per project. Run `amplify remove api` to remove an API.');
        return;
    }
    const apiName = apiNames[0];
    amplify_prompts_1.printer.warn(`This will recreate all tables backing models in your GraphQL API ${apiName}.`);
    amplify_prompts_1.printer.warn('ALL EXISTING DATA IN THESE TABLES WILL BE LOST.');
    await amplify_prompts_1.prompter.input('Type the name of the API to confirm you want to continue', {
        validate: (0, amplify_prompts_1.exact)(apiName, 'Input does not match the GraphQL API name'),
    });
    const { amplify, parameters } = context;
    const resourceName = parameters.first;
    amplify.constructExeInfo(context);
    return amplify.pushResources(context, amplify_cli_core_1.AmplifyCategories.API, resourceName, undefined, rebuild);
};
exports.run = run;
//# sourceMappingURL=rebuild.js.map