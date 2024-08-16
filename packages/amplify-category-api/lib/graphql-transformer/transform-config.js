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
exports.readSchema = exports.throwIfNotJSONExt = exports.writeConfig = exports.loadConfig = void 0;
const path = __importStar(require("path"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const fs_extra_1 = __importDefault(require("fs-extra"));
const graphql_transformer_core_1 = require("graphql-transformer-core");
async function loadConfig(projectDir) {
    let config = {};
    try {
        const configPath = path.join(projectDir, graphql_transformer_core_1.TRANSFORM_CONFIG_FILE_NAME);
        const configExists = fs_extra_1.default.existsSync(configPath);
        if (configExists) {
            const configStr = await fs_extra_1.default.readFile(configPath, 'utf-8');
            config = JSON.parse(configStr);
        }
        return config;
    }
    catch (err) {
        return config;
    }
}
exports.loadConfig = loadConfig;
async function writeConfig(projectDir, config) {
    const configFilePath = path.join(projectDir, graphql_transformer_core_1.TRANSFORM_CONFIG_FILE_NAME);
    await fs_extra_1.default.writeFile(configFilePath, JSON.stringify(config, null, 4));
    return config;
}
exports.writeConfig = writeConfig;
function throwIfNotJSONExt(stackFile) {
    const extension = path.extname(stackFile);
    if (extension === '.yaml' || extension === '.yml') {
        throw new amplify_cli_core_1.AmplifyError('CloudFormationTemplateError', {
            message: 'Yaml is not yet supported',
            resolution: `Please convert the CloudFormation stack ${stackFile} to json.`,
        });
    }
    if (extension !== '.json') {
        throw new amplify_cli_core_1.AmplifyError('CloudFormationTemplateError', {
            message: `Invalid extension ${extension} for stack ${stackFile}`,
            resolution: `Convert the CloudFormation stack ${stackFile} to json.`,
        });
    }
}
exports.throwIfNotJSONExt = throwIfNotJSONExt;
async function readSchema(projectDirectory) {
    const schemaFilePath = path.join(projectDirectory, 'schema.graphql');
    const schemaDirectoryPath = path.join(projectDirectory, 'schema');
    const schemaFileExists = fs_extra_1.default.existsSync(schemaFilePath);
    const schemaDirectoryExists = fs_extra_1.default.existsSync(schemaDirectoryPath);
    let schema;
    if (schemaFileExists) {
        schema = (await fs_extra_1.default.readFile(schemaFilePath)).toString();
    }
    else if (schemaDirectoryExists) {
        schema = (await readSchemaDocuments(schemaDirectoryPath)).join('\n');
    }
    else {
        throw new amplify_cli_core_1.AmplifyError('ApiCategorySchemaNotFoundError', {
            message: 'No schema found',
            resolution: `GraphQL schema should be either in ${schemaFilePath} or at schema directory ${schemaDirectoryPath}`,
        });
    }
    return schema;
}
exports.readSchema = readSchema;
async function readSchemaDocuments(schemaDirectoryPath) {
    const files = await fs_extra_1.default.readdir(schemaDirectoryPath);
    let schemaDocuments = [];
    for (const fileName of files) {
        if (fileName.indexOf('.') === 0) {
            continue;
        }
        const fullPath = `${schemaDirectoryPath}/${fileName}`;
        const stats = await fs_extra_1.default.lstat(fullPath);
        if (stats.isDirectory()) {
            const childDocs = await readSchemaDocuments(fullPath);
            schemaDocuments = schemaDocuments.concat(childDocs);
        }
        else if (stats.isFile()) {
            const schemaDoc = await fs_extra_1.default.readFile(fullPath);
            schemaDocuments.push(schemaDoc);
        }
    }
    return schemaDocuments;
}
//# sourceMappingURL=transform-config.js.map