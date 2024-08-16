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
exports.editSchemaFlow = void 0;
const path = __importStar(require("path"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const category_constants_1 = require("../../../category-constants");
const aws_constants_1 = require("../aws-constants");
const editSchemaFlow = async (context, apiName) => {
    if (!(await amplify_prompts_1.prompter.yesOrNo('Do you want to edit the schema now?', true))) {
        return;
    }
    const schemaPath = path.join(amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, category_constants_1.category, apiName), aws_constants_1.gqlSchemaFilename);
    await context.amplify.openEditor(context, schemaPath, false);
};
exports.editSchemaFlow = editSchemaFlow;
//# sourceMappingURL=edit-schema-flow.js.map