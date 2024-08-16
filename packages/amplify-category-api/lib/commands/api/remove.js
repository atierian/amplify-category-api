"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.name = void 0;
const path = __importStar(require("path"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const subcommand = 'remove';
const gqlConfigFilename = '.graphqlconfig.yml';
exports.name = subcommand;
const run = async (context) => {
    const resourceName = context.parameters.first;
    const resourceValues = await context.amplify.removeResource(context, amplify_cli_core_1.AmplifyCategories.API, resourceName, {
        serviceSuffix: { [amplify_cli_core_1.AmplifySupportedService.APPSYNC]: '(GraphQL API)', [amplify_cli_core_1.AmplifySupportedService.APIGW]: '(REST API)' },
    });
    try {
        if (!resourceValues) {
            return;
        }
        if (resourceValues.service === amplify_cli_core_1.AmplifySupportedService.APPSYNC) {
            const { projectPath } = context.amplify.getEnvInfo();
            const gqlConfigFile = path.normalize(path.join(projectPath, gqlConfigFilename));
            context.filesystem.remove(gqlConfigFile);
        }
    }
    catch (err) {
        amplify_prompts_1.printer.error('There was an error removing the api resource');
        throw err;
    }
};
exports.run = run;
//# sourceMappingURL=remove.js.map