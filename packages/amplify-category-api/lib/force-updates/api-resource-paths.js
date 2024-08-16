"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApiResourceDir = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const fs_extra_1 = __importDefault(require("fs-extra"));
const containsGraphQLApi = () => {
    var _a;
    const projectPath = (_a = amplify_cli_core_1.pathManager.findProjectRoot()) !== null && _a !== void 0 ? _a : process.cwd();
    const meta = amplify_cli_core_1.stateManager.getMeta(projectPath);
    const apiNames = Object.entries((meta === null || meta === void 0 ? void 0 : meta.api) || {})
        .filter(([_, apiResource]) => apiResource.service === 'AppSync')
        .map(([name]) => name);
    const doesNotHaveGqlApi = apiNames.length < 1;
    if (doesNotHaveGqlApi) {
        return false;
    }
    const apiName = apiNames[0];
    const apiResourceDir = amplify_cli_core_1.pathManager.getResourceDirectoryPath(projectPath, 'api', apiName);
    if (!fs_extra_1.default.existsSync(apiResourceDir)) {
        return false;
    }
    return true;
};
const getApiResourceDir = () => {
    var _a;
    const hasGraphQLApi = containsGraphQLApi();
    if (!hasGraphQLApi) {
        return undefined;
    }
    const projectPath = (_a = amplify_cli_core_1.pathManager.findProjectRoot()) !== null && _a !== void 0 ? _a : process.cwd();
    const meta = amplify_cli_core_1.stateManager.getMeta(projectPath);
    const apiNames = Object.entries((meta === null || meta === void 0 ? void 0 : meta.api) || {})
        .filter(([_, apiResource]) => apiResource.service === 'AppSync')
        .map(([name]) => name);
    const apiName = apiNames[0];
    const apiResourceDir = amplify_cli_core_1.pathManager.getResourceDirectoryPath(projectPath, 'api', apiName);
    return apiResourceDir;
};
exports.getApiResourceDir = getApiResourceDir;
//# sourceMappingURL=api-resource-paths.js.map