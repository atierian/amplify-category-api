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
exports.legacyUpdateResource = void 0;
const path = __importStar(require("path"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const fs = __importStar(require("fs-extra"));
const aws_constants_1 = require("./aws-constants");
const legacy_add_resource_1 = require("./legacy-add-resource");
const dynamic_imports_1 = require("./utils/dynamic-imports");
const legacyUpdateResource = async (updateWalkthroughPromise, context, category, service) => {
    let answers;
    let { cfnFilename } = await (0, dynamic_imports_1.serviceMetadataFor)(service);
    const result = await updateWalkthroughPromise;
    const options = {};
    if (result) {
        if (result.answers) {
            ({ answers } = result);
            options.dependsOn = result.dependsOn;
        }
        else {
            answers = result;
        }
        if (!result.noCfnFile) {
            if (answers.customCfnFile) {
                cfnFilename = answers.customCfnFile;
            }
            (0, legacy_add_resource_1.addPolicyResourceNameToPaths)(answers.paths);
            (0, legacy_add_resource_1.copyCfnTemplate)(context, category, answers, cfnFilename);
            const parameters = { ...answers };
            const resourceDirPath = amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, category, parameters.resourceName);
            fs.ensureDirSync(resourceDirPath);
            const parametersFilePath = path.join(resourceDirPath, aws_constants_1.parametersFileName);
            amplify_cli_core_1.JSONUtilities.writeJson(parametersFilePath, parameters);
            context.amplify.updateamplifyMetaAfterResourceUpdate(category, answers.resourceName, 'dependsOn', answers.dependsOn);
        }
    }
};
exports.legacyUpdateResource = legacyUpdateResource;
//# sourceMappingURL=legacy-update-resource.js.map