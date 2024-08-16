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
exports.getAppSyncResourceName = exports.getAppSyncAuthConfig = exports.getAPIResourceDir = exports.getAppSyncAPIName = exports.ensureNoAppSyncAPIExists = exports.getAppSyncAPINames = exports.checkIfAuthExists = exports.authConfigHasApiKey = void 0;
const path = __importStar(require("path"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const authConfigHasApiKey = (authConfig) => {
    if (!authConfig) {
        return false;
    }
    return (Array.of(authConfig.defaultAuthentication)
        .concat(authConfig.additionalAuthenticationProviders)
        .filter((auth) => !!auth)
        .map((auth) => auth.authenticationType)
        .findIndex((authType) => authType === 'API_KEY') > -1);
};
exports.authConfigHasApiKey = authConfigHasApiKey;
const checkIfAuthExists = () => {
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    let authResourceName;
    const authServiceName = amplify_cli_core_1.AmplifySupportedService.COGNITO;
    const authCategoryName = amplify_cli_core_1.AmplifyCategories.AUTH;
    if (amplifyMeta[authCategoryName] && Object.keys(amplifyMeta[authCategoryName]).length > 0) {
        const categoryResources = amplifyMeta[authCategoryName];
        Object.keys(categoryResources).forEach((resource) => {
            if (categoryResources[resource].service === authServiceName) {
                authResourceName = resource;
            }
        });
    }
    return authResourceName;
};
exports.checkIfAuthExists = checkIfAuthExists;
const getAppSyncAPINames = () => {
    var _a;
    return Object.entries(((_a = amplify_cli_core_1.stateManager.getMeta()) === null || _a === void 0 ? void 0 : _a.api) || {})
        .filter(([_, apiResource]) => apiResource.service === 'AppSync')
        .map(([name]) => name);
};
exports.getAppSyncAPINames = getAppSyncAPINames;
const ensureNoAppSyncAPIExists = () => {
    const apiNames = (0, exports.getAppSyncAPINames)();
    if ((apiNames === null || apiNames === void 0 ? void 0 : apiNames.length) > 0) {
        throw new Error(`You already have an AppSync API named ${apiNames[0]} in your project. Use the "amplify update api" command to update your existing AppSync API.`);
    }
};
exports.ensureNoAppSyncAPIExists = ensureNoAppSyncAPIExists;
const getAppSyncAPIName = () => {
    const apiNames = (0, exports.getAppSyncAPINames)();
    if ((apiNames === null || apiNames === void 0 ? void 0 : apiNames.length) === 0) {
        throw new Error(`You do not have AppSync API added. Use "amplify add api" or "amplify import api" to add one to your project.`);
    }
    return apiNames[0];
};
exports.getAppSyncAPIName = getAppSyncAPIName;
const getAPIResourceDir = (apiName) => {
    return path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), amplify_cli_core_1.AmplifyCategories.API, apiName);
};
exports.getAPIResourceDir = getAPIResourceDir;
const getAppSyncAuthConfig = (projectMeta) => {
    const entry = getAppSyncAmplifyMetaEntry(projectMeta);
    if (entry) {
        const value = entry[1];
        return value && value.output ? value.output.authConfig : {};
    }
};
exports.getAppSyncAuthConfig = getAppSyncAuthConfig;
const getAppSyncResourceName = (projectMeta) => {
    const entry = getAppSyncAmplifyMetaEntry(projectMeta);
    if (entry) {
        return entry[0];
    }
};
exports.getAppSyncResourceName = getAppSyncResourceName;
const getAppSyncAmplifyMetaEntry = (projectMeta) => {
    return Object.entries(projectMeta[amplify_cli_core_1.AmplifyCategories.API] || {}).find(([, value]) => value.service === amplify_cli_core_1.AmplifySupportedService.APPSYNC);
};
//# sourceMappingURL=amplify-meta-utils.js.map