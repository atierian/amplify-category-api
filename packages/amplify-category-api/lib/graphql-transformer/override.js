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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidOverrideError = exports.applyFileBasedOverride = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const lodash_1 = __importDefault(require("lodash"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_meta_utils_1 = require("../provider-utils/awscloudformation/utils/amplify-meta-utils");
const utils_1 = require("./types/utils");
function applyFileBasedOverride(scope, overrideDirPath) {
    const overrideDir = overrideDirPath !== null && overrideDirPath !== void 0 ? overrideDirPath : path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), 'api', (0, amplify_meta_utils_1.getAppSyncAPIName)());
    const overrideFilePath = path.join(overrideDir, 'build', 'override.js');
    if (!fs.existsSync(overrideFilePath)) {
        return {};
    }
    const stacks = [];
    const amplifyApiObj = {};
    scope.node.findAll().forEach((node) => {
        const resource = node;
        if (resource.cfnResourceType === 'AWS::CloudFormation::Stack') {
            stacks.push(node.node.id.split('.')[0]);
        }
    });
    scope.node.findAll().forEach((node) => {
        const resource = node;
        let pathArr;
        if (node.node.id === 'Resource') {
            pathArr = node.node.path.split('/').filter((key) => key !== node.node.id);
        }
        else {
            pathArr = node.node.path.split('/');
        }
        let constructPathObj;
        if (resource.cfnResourceType) {
            constructPathObj = (0, utils_1.getStackMeta)(pathArr, node.node.id, stacks, resource);
            if (!lodash_1.default.isEmpty(constructPathObj.rootStack)) {
                const field = constructPathObj.rootStack.stackType;
                const { resourceName } = constructPathObj;
                lodash_1.default.set(amplifyApiObj, [field, resourceName], resource);
            }
            else if (!lodash_1.default.isEmpty(constructPathObj.nestedStack)) {
                const fieldType = constructPathObj.nestedStack.stackType;
                const fieldName = constructPathObj.nestedStack.stackName;
                const { resourceName } = constructPathObj;
                if (constructPathObj.resourceType.includes('Resolver')) {
                    lodash_1.default.set(amplifyApiObj, [fieldType, fieldName, 'resolvers', resourceName], resource);
                }
                else if (constructPathObj.resourceType.includes('FunctionConfiguration')) {
                    lodash_1.default.set(amplifyApiObj, [fieldType, fieldName, 'appsyncFunctions', resourceName], resource);
                }
                else {
                    lodash_1.default.set(amplifyApiObj, [fieldType, fieldName, resourceName], resource);
                }
            }
        }
    });
    const appsyncResourceObj = (0, utils_1.convertToAppsyncResourceObj)(amplifyApiObj);
    const { envName } = amplify_cli_core_1.stateManager.getLocalEnvInfo();
    const { projectName } = amplify_cli_core_1.stateManager.getProjectConfig();
    const projectInfo = {
        envName,
        projectName,
    };
    try {
        delete require.cache[require.resolve(overrideFilePath)];
        const overrideImport = require(overrideFilePath);
        if (overrideImport && (overrideImport === null || overrideImport === void 0 ? void 0 : overrideImport.override) && typeof (overrideImport === null || overrideImport === void 0 ? void 0 : overrideImport.override) === 'function') {
            overrideImport.override(appsyncResourceObj, projectInfo);
        }
    }
    catch (err) {
        throw new InvalidOverrideError(err);
    }
    return appsyncResourceObj;
}
exports.applyFileBasedOverride = applyFileBasedOverride;
class InvalidOverrideError extends Error {
    constructor(error) {
        super('Executing overrides failed.');
        this.name = 'InvalidOverrideError';
        this.details = error.message;
        this.resolution = 'There may be runtime errors in your overrides file. If so, fix the errors and try again.';
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, InvalidOverrideError);
        }
    }
}
exports.InvalidOverrideError = InvalidOverrideError;
//# sourceMappingURL=override.js.map