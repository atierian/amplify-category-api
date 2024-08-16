"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemaHasSandboxModeEnabled = exports.showGlobalSandboxModeWarning = exports.showSandboxModePrompts = void 0;
const chalk_1 = __importDefault(require("chalk"));
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const graphql_1 = require("graphql");
const api_key_helpers_1 = require("./api-key-helpers");
const AMPLIFY = 'AMPLIFY';
const AUTHORIZATION_RULE = 'AuthRule';
const ALLOW = 'allow';
const PUBLIC = 'public';
async function showSandboxModePrompts(context) {
    if (!(await (0, api_key_helpers_1.hasApiKey)(context))) {
        amplify_prompts_1.printer.info(`
⚠️  WARNING: Global Sandbox Mode has been enabled, which requires a valid API key. If
you'd like to disable, remove ${chalk_1.default.green('"input AMPLIFY { globalAuthRule: AuthRule = { allow: public } }"')}
from your GraphQL schema and run 'amplify push' again. If you'd like to proceed with
sandbox mode disabled, do not create an API Key.
`, 'yellow');
        return await context.amplify.invokePluginMethod(context, 'api', undefined, 'promptToAddApiKey', [context]);
    }
}
exports.showSandboxModePrompts = showSandboxModePrompts;
function showGlobalSandboxModeWarning(doclink) {
    amplify_prompts_1.printer.info(`
⚠️  WARNING: your GraphQL API currently allows public create, read, update, and delete access to all models via an API Key. To configure PRODUCTION-READY authorization rules, review: ${doclink}
`, 'yellow');
}
exports.showGlobalSandboxModeWarning = showGlobalSandboxModeWarning;
function matchesGlobalAuth(field) {
    return ['global_auth_rule', 'globalAuthRule'].includes(field.name.value);
}
function schemaHasSandboxModeEnabled(schema, docLink) {
    const { definitions } = (0, graphql_1.parse)(schema);
    const amplifyInputType = definitions.find((d) => d.kind === 'InputObjectTypeDefinition' && d.name.value === AMPLIFY);
    if (!amplifyInputType) {
        return false;
    }
    const authRuleField = amplifyInputType.fields.find(matchesGlobalAuth);
    if (!authRuleField) {
        return false;
    }
    const typeName = authRuleField.type.name.value;
    const defaultValueField = authRuleField.defaultValue.fields[0];
    const defaultValueName = defaultValueField.name.value;
    const defaultValueValue = defaultValueField.value.value;
    const authScalarMatch = typeName === AUTHORIZATION_RULE;
    const defaultValueNameMatch = defaultValueName === ALLOW;
    const defaultValueValueMatch = defaultValueValue === PUBLIC;
    if (authScalarMatch && defaultValueNameMatch && defaultValueValueMatch) {
        return true;
    }
    throw Error(`There was a problem with your auth configuration. Learn more about auth here: ${docLink}`);
}
exports.schemaHasSandboxModeEnabled = schemaHasSandboxModeEnabled;
//# sourceMappingURL=sandbox-mode-helpers.js.map