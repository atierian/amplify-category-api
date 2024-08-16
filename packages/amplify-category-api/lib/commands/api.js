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
exports.name = amplify_cli_core_1.AmplifyCategories.API;
const run = async (context) => {
    var _a;
    if (/^win/.test(process.platform)) {
        try {
            const { run } = await (_a = path.join('.', amplify_cli_core_1.AmplifyCategories.API, context.parameters.first), Promise.resolve().then(() => __importStar(require(_a))));
            return run(context);
        }
        catch (e) {
            amplify_prompts_1.printer.error('Command not found');
        }
    }
    const header = `amplify ${amplify_cli_core_1.AmplifyCategories.API} <subcommands>`;
    const commands = [
        {
            name: 'add',
            description: `Takes you through a CLI flow to add a ${amplify_cli_core_1.AmplifyCategories.API} resource to your local backend`,
        },
        {
            name: 'push',
            description: `Provisions ${amplify_cli_core_1.AmplifyCategories.API} cloud resources and its dependencies with the latest local developments`,
        },
        {
            name: 'remove',
            description: `Removes ${amplify_cli_core_1.AmplifyCategories.API} resource from your local backend which would be removed from the cloud on the next push command`,
        },
        {
            name: 'update',
            description: `Takes you through steps in the CLI to update an ${amplify_cli_core_1.AmplifyCategories.API} resource`,
        },
        {
            name: 'gql-compile',
            description: 'Compiles your GraphQL schema and generates a corresponding cloudformation template',
        },
        {
            name: 'add-graphql-datasource',
            description: 'Provisions the AppSync resources and its dependencies for the provided Aurora Serverless data source',
        },
        {
            name: 'console',
            description: 'Opens the web console for the selected api service',
        },
        {
            name: 'migrate',
            description: 'Migrates GraphQL schemas to the latest GraphQL transformer version',
        },
        {
            name: 'rebuild',
            description: 'Removes and recreates all DynamoDB tables backing a GraphQL API. Useful for resetting test data during the development phase of an app',
        },
        {
            name: 'override',
            description: 'Generates overrides file to apply custom modifications to CloudFormation',
        },
        {
            name: 'import',
            description: 'Imports existing datasource to GraphQL API',
        },
        {
            name: 'generate-schema',
            description: 'Generates the GraphQL schema from the Data Source',
        },
        {
            name: 'update-secrets',
            description: 'Updates the API plugin related secrets',
        },
    ];
    context.amplify.showHelp(header, commands);
    amplify_prompts_1.printer.blankLine();
};
exports.run = run;
//# sourceMappingURL=api.js.map