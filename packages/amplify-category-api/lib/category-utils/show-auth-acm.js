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
exports.printACM = exports.showApiAuthAcm = void 0;
const path = __importStar(require("path"));
const graphql_auth_transformer_1 = require("@aws-amplify/graphql-auth-transformer");
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const graphql_1 = require("graphql");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const graphql_transformer_core_1 = require("@aws-amplify/graphql-transformer-core");
const graphql_transformer_core_2 = require("graphql-transformer-core");
const graphql_transformer_1 = require("../graphql-transformer");
const showApiAuthAcm = async (context, modelName) => {
    var _a;
    var _b, _c, _d, _e;
    const providerPlugin = await (_a = (_b = context.amplify.getProviderPlugins(context)) === null || _b === void 0 ? void 0 : _b.awscloudformation, Promise.resolve().then(() => __importStar(require(_a))));
    const transformerVersion = await (0, graphql_transformer_1.getTransformerVersion)(context);
    if (transformerVersion < 2) {
        amplify_prompts_1.printer.error('This command requires version two or greater of the GraphQL transformer.');
        return;
    }
    const apiNames = Object.entries(((_c = amplify_cli_core_1.stateManager.getMeta()) === null || _c === void 0 ? void 0 : _c.api) || {})
        .filter(([, apiResource]) => apiResource.service === 'AppSync')
        .map(([name]) => name);
    if (apiNames.length === 0) {
        amplify_prompts_1.printer.info('No GraphQL API configured in the project. To add a GraphQL API run `amplify add api`.');
        return;
    }
    if (apiNames.length > 1) {
        amplify_prompts_1.printer.error('You have multiple GraphQL APIs in the project. Only one GraphQL API is allowed per project. Run `amplify remove api` to remove an API.');
        return;
    }
    try {
        await providerPlugin.compileSchema(context, {
            forceCompile: true,
        });
    }
    catch (error) {
        amplify_prompts_1.printer.warn('ACM generation requires a valid schema, the provided schema is invalid.');
        if (error.name) {
            amplify_prompts_1.printer.error(`${error.name}: ${(_d = error.message) === null || _d === void 0 ? void 0 : _d.trim()}`);
        }
        else {
            amplify_prompts_1.printer.error(`An error has occurred during schema compilation: ${(_e = error.message) === null || _e === void 0 ? void 0 : _e.trim()}`);
        }
        return;
    }
    const apiName = apiNames[0];
    const apiResourceDir = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), 'api', apiName);
    const { schema } = await (0, graphql_transformer_core_2.readProjectSchema)(apiResourceDir);
    printACM(schema, modelName);
};
exports.showApiAuthAcm = showApiAuthAcm;
function printACM(sdl, nodeName) {
    var _a, _b;
    const schema = (0, graphql_1.parse)(sdl);
    const type = schema.definitions.find((node) => { var _a; return node.kind === 'ObjectTypeDefinition' && node.name.value === nodeName && ((_a = node === null || node === void 0 ? void 0 : node.directives) === null || _a === void 0 ? void 0 : _a.find((dir) => dir.name.value === 'model')); });
    if (!type) {
        throw new Error(`Model "${nodeName}" does not exist.`);
    }
    else {
        const fields = type.fields.map((field) => field.name.value);
        const acm = new graphql_auth_transformer_1.AccessControlMatrix({ name: type.name.value, operations: graphql_auth_transformer_1.MODEL_OPERATIONS, resources: fields });
        const parentAuthDirective = (_a = type.directives) === null || _a === void 0 ? void 0 : _a.find((dir) => dir.name.value === 'auth');
        if (parentAuthDirective) {
            const authRules = (0, graphql_auth_transformer_1.getAuthDirectiveRules)(new graphql_transformer_core_1.DirectiveWrapper(parentAuthDirective), {
                isField: false,
                deepMergeArguments: amplify_cli_core_1.FeatureFlags.getBoolean('graphqltransformer.shouldDeepMergeDirectiveConfigDefaults'),
            });
            convertModelRulesToRoles(acm, authRules);
        }
        for (const fieldNode of type.fields || []) {
            const fieldAuthDir = (_b = fieldNode.directives) === null || _b === void 0 ? void 0 : _b.find((dir) => dir.name.value === 'auth');
            if (fieldAuthDir) {
                if (parentAuthDirective) {
                    acm.resetAccessForResource(fieldNode.name.value);
                }
                const authRules = (0, graphql_auth_transformer_1.getAuthDirectiveRules)(new graphql_transformer_core_1.DirectiveWrapper(fieldAuthDir));
                convertModelRulesToRoles(acm, authRules, fieldNode.name.value);
            }
        }
        const truthTable = acm.getAcmPerRole();
        if (truthTable.size === 0) {
            amplify_prompts_1.printer.warn(`No auth rules have been configured for the "${type.name.value}" model.`);
        }
        for (const [role, acm] of truthTable) {
            console.group(role);
            console.table(acm);
            console.groupEnd();
        }
    }
}
exports.printACM = printACM;
function convertModelRulesToRoles(acm, authRules, field) {
    for (const rule of authRules) {
        const operations = rule.operations || graphql_auth_transformer_1.MODEL_OPERATIONS;
        if (rule.groups && !rule.groupsField) {
            rule.groups.forEach((group) => {
                const roleName = `${rule.provider}:staticGroup:${group}`;
                acm.setRole({ role: roleName, resource: field, operations });
            });
        }
        else {
            let roleName;
            switch (rule.provider) {
                case 'apiKey':
                    roleName = 'apiKey:public';
                    break;
                case 'iam':
                    roleName = `iam:${rule.allow}`;
                    break;
                case 'oidc':
                case 'userPools':
                    if (rule.allow === 'groups') {
                        const groupsField = rule.groupsField || graphql_auth_transformer_1.DEFAULT_GROUPS_FIELD;
                        const groupsClaim = rule.groupClaim || graphql_auth_transformer_1.DEFAULT_GROUP_CLAIM;
                        roleName = `${rule.provider}:dynamicGroup:${groupsClaim}:${groupsField}`;
                    }
                    else if (rule.allow === 'owner') {
                        const ownerField = rule.ownerField || graphql_auth_transformer_1.DEFAULT_OWNER_FIELD;
                        roleName = `${rule.provider}:owner:${ownerField}`;
                    }
                    else if (rule.allow === 'private') {
                        roleName = `${rule.provider}:${rule.allow}`;
                    }
                    else {
                        throw new Error(`Could not create a role from ${JSON.stringify(rule)}`);
                    }
                    break;
                default:
                    throw new Error(`Could not create a role from ${JSON.stringify(rule)}`);
            }
            acm.setRole({ role: roleName, resource: field, operations });
        }
    }
}
//# sourceMappingURL=show-auth-acm.js.map