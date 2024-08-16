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
exports.hasNodeToNodeEncryptionOptions = exports.shouldEnableNodeToNodeEncryption = void 0;
const path = __importStar(require("path"));
const graphql_transformer_common_1 = require("graphql-transformer-common");
const fs = __importStar(require("fs-extra"));
const graphql_transformer_core_1 = require("graphql-transformer-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const shouldEnableNodeToNodeEncryption = (apiName, projectRoot, currentCloudBackendDir) => {
    try {
        const nodeToNodeEncryptionParameter = getNodeToNodeEncryptionConfigValue(projectRoot, apiName);
        const doesExistingBackendHaveNodeToNodeEncryption = getCurrentCloudBackendStackFiles(currentCloudBackendDir, apiName).some((definition) => (0, exports.hasNodeToNodeEncryptionOptions)(definition));
        warnOnExistingNodeToNodeEncryption(doesExistingBackendHaveNodeToNodeEncryption);
        if (nodeToNodeEncryptionParameter !== undefined) {
            return nodeToNodeEncryptionParameter;
        }
        return doesExistingBackendHaveNodeToNodeEncryption;
    }
    catch (e) {
        return false;
    }
};
exports.shouldEnableNodeToNodeEncryption = shouldEnableNodeToNodeEncryption;
const warnOnExistingNodeToNodeEncryption = (doesExistingBackendHaveNodeToNodeEncryption) => {
    if (!doesExistingBackendHaveNodeToNodeEncryption) {
        return;
    }
    amplify_prompts_1.printer.warn(`
NodeToNodeEncryption is enabled for this Search Domain, disabling this flag or reverting to Amplify CLI <= 10.5.2 will result in this being disabled, triggering a rebuild of the Search Index. To backfill your search domain see https://docs.amplify.aws/cli/graphql/troubleshooting/#backfill-opensearch-index-from-dynamodb-table.
`);
};
const getCurrentCloudBackendStackFiles = (currentCloudBackendDir, apiName) => {
    const backendPath = path.join(currentCloudBackendDir, 'api', apiName, 'build', 'stacks');
    try {
        return fs.readdirSync(backendPath).map((stackFile) => amplify_cli_core_1.JSONUtilities.readJson(path.join(backendPath, stackFile)));
    }
    catch (e) {
        return [];
    }
};
const hasNodeToNodeEncryptionOptions = (stackDefinition) => {
    try {
        const domain = stackDefinition['Resources'][graphql_transformer_common_1.ResourceConstants.RESOURCES.OpenSearchDomainLogicalID];
        const nodeToNodeEncryptionOption = domain['Properties']['NodeToNodeEncryptionOptions']['Enabled'];
        return nodeToNodeEncryptionOption === true;
    }
    catch (e) { }
    return false;
};
exports.hasNodeToNodeEncryptionOptions = hasNodeToNodeEncryptionOptions;
const getNodeToNodeEncryptionConfigValue = (projectRoot, apiName) => {
    const configPath = projectRoot ? path.join(projectRoot, 'amplify', 'backend', 'api', apiName, graphql_transformer_core_1.TRANSFORM_CONFIG_FILE_NAME) : undefined;
    if (configPath && fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        return config.NodeToNodeEncryption;
    }
    return undefined;
};
//# sourceMappingURL=searchable-node-to-node-encryption.js.map