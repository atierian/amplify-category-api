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
const subcommand = 'console';
exports.name = subcommand;
const run = async (context) => {
    var _a, _b;
    const servicesMetadata = (await (_a = path.join('..', '..', 'provider-utils', 'supported-services'), Promise.resolve().then(() => __importStar(require(_a))))).supportedServices;
    const result = await context.amplify.serviceSelectionPrompt(context, amplify_cli_core_1.AmplifyCategories.API, servicesMetadata);
    try {
        const providerController = await (_b = path.join('..', '..', 'provider-utils', result.providerName, 'index'), Promise.resolve().then(() => __importStar(require(_b))));
        if (!providerController) {
            throw new Error(`Provider "${result.providerName}" is not configured for this category`);
        }
        return providerController.console(context, result.service);
    }
    catch (err) {
        amplify_prompts_1.printer.error('Error opening console.');
        throw err;
    }
};
exports.run = run;
//# sourceMappingURL=console.js.map