"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.name = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const subcommand = 'push';
exports.name = subcommand;
const run = async (context) => {
    const resourceName = context.parameters.first;
    context.amplify.constructExeInfo(context);
    return context.amplify.pushResources(context, amplify_cli_core_1.AmplifyCategories.API, resourceName);
};
exports.run = run;
//# sourceMappingURL=push.js.map