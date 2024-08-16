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
const subcommand = 'add';
const category = amplify_cli_core_1.AmplifyCategories.API;
exports.name = subcommand;
const run = async (context) => {
    var _a;
    const servicesMetadata = (await (_a = path.join('..', '..', 'provider-utils', 'supported-services'), Promise.resolve().then(() => __importStar(require(_a))))).supportedServices;
    return context.amplify
        .serviceSelectionPrompt(context, category, servicesMetadata)
        .then(async (result) => {
        var _a;
        const options = {
            service: result.service,
            providerPlugin: result.providerName,
        };
        const providerController = await (_a = path.join('..', '..', 'provider-utils', result.providerName, 'index'), Promise.resolve().then(() => __importStar(require(_a))));
        if (!providerController) {
            amplify_prompts_1.printer.error('Provider not configured for this category');
            return;
        }
        if ((await shouldUpdateExistingRestApi(context, result.service)) === true) {
            return providerController.updateResource(context, category, result.service, { allowContainers: false });
        }
        return providerController.addResource(context, result.service, options);
    })
        .then((resourceName) => {
        amplify_prompts_1.printer.success(`Successfully added resource ${resourceName} locally`);
        amplify_prompts_1.printer.blankLine();
        amplify_prompts_1.printer.success('Some next steps:');
        amplify_prompts_1.printer.info('"amplify push" will build all your local backend resources and provision it in the cloud');
        amplify_prompts_1.printer.info('"amplify publish" will build all your local backend and frontend resources (if you have hosting category added) and provision it in the cloud');
        amplify_prompts_1.printer.blankLine();
    })
        .catch(async (err) => {
        amplify_prompts_1.printer.error('There was an error adding the API resource');
        throw err;
    });
};
exports.run = run;
async function shouldUpdateExistingRestApi(context, selectedService) {
    if (selectedService !== amplify_cli_core_1.AmplifySupportedService.APIGW) {
        return false;
    }
    const { allResources } = await context.amplify.getResourceStatus();
    const hasRestApis = allResources.some((resource) => resource.service === amplify_cli_core_1.AmplifySupportedService.APIGW && resource.mobileHubMigrated !== true);
    if (!hasRestApis) {
        return false;
    }
    return amplify_prompts_1.prompter.confirmContinue('Would you like to add a new path to an existing REST API:');
}
//# sourceMappingURL=add.js.map