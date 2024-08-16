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
exports.addPolicyResourceNameToPaths = exports.copyCfnTemplate = exports.legacyAddResource = void 0;
const path = __importStar(require("path"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const fs = __importStar(require("fs-extra"));
const aws_constants_1 = require("./aws-constants");
const dynamic_imports_1 = require("./utils/dynamic-imports");
const legacyAddResource = async (serviceWalkthroughPromise, context, category, service, options) => {
    let answers;
    let { cfnFilename } = await (0, dynamic_imports_1.serviceMetadataFor)(service);
    const result = await serviceWalkthroughPromise;
    if (result.answers) {
        ({ answers } = result);
        options.dependsOn = result.dependsOn;
    }
    else {
        answers = result;
    }
    if (result.output) {
        options.output = result.output;
    }
    if (!result.noCfnFile) {
        if (answers.customCfnFile) {
            cfnFilename = answers.customCfnFile;
        }
        (0, exports.addPolicyResourceNameToPaths)(answers.paths);
        (0, exports.copyCfnTemplate)(context, category, answers, cfnFilename);
        const parameters = { ...answers };
        const resourceDirPath = amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, category, parameters.resourceName);
        (0, amplify_cli_core_1.isResourceNameUnique)(category, parameters.resourceName);
        fs.ensureDirSync(resourceDirPath);
        const parametersFilePath = path.join(resourceDirPath, aws_constants_1.parametersFileName);
        amplify_cli_core_1.JSONUtilities.writeJson(parametersFilePath, parameters);
        const cfnParametersFilePath = path.join(resourceDirPath, aws_constants_1.cfnParametersFilename);
        amplify_cli_core_1.JSONUtilities.writeJson(cfnParametersFilePath, {});
    }
    context.amplify.updateamplifyMetaAfterResourceAdd(category, answers.resourceName, options);
    return answers.resourceName;
};
exports.legacyAddResource = legacyAddResource;
const copyCfnTemplate = (context, category, options, cfnFilename) => {
    const resourceDirPath = amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, category, options.resourceName);
    const copyJobs = [
        {
            dir: path.join(aws_constants_1.rootAssetDir, 'cloudformation-templates'),
            template: cfnFilename,
            target: path.join(resourceDirPath, `${options.resourceName}-cloudformation-template.json`),
        },
    ];
    return context.amplify.copyBatch(context, copyJobs, options, true, false);
};
exports.copyCfnTemplate = copyCfnTemplate;
const addPolicyResourceNameToPaths = (paths) => {
    if (Array.isArray(paths)) {
        paths.forEach((p) => {
            const pathName = p.name;
            if (typeof pathName === 'string') {
                p.policyResourceName = pathName.replace(/{[a-zA-Z0-9\-]+}/g, '*');
            }
        });
    }
};
exports.addPolicyResourceNameToPaths = addPolicyResourceNameToPaths;
//# sourceMappingURL=legacy-add-resource.js.map