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
exports.schemaReader = exports.SchemaReader = void 0;
const path_1 = __importDefault(require("path"));
const fs = __importStar(require("fs-extra"));
const graphql_1 = require("graphql");
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const graphql_transformer_1 = require("@aws-amplify/graphql-transformer");
const constants_1 = require("../graphql-transformer/constants");
const transformer_options_v2_1 = require("../graphql-transformer/transformer-options-v2");
const context_util_1 = require("./context-util");
class SchemaReader {
    constructor() {
        this.getSchemaPath = async (resourceDir) => {
            if (this.schemaPath) {
                return this.schemaPath;
            }
            const schemaFilePath = path_1.default.normalize(path_1.default.join(resourceDir, constants_1.SCHEMA_FILENAME));
            const schemaDirPath = path_1.default.normalize(path_1.default.join(resourceDir, constants_1.SCHEMA_DIR_NAME));
            if (fs.pathExistsSync(schemaFilePath)) {
                this.schemaPath = schemaFilePath;
            }
            else if (fs.pathExistsSync(schemaDirPath)) {
                this.schemaPath = schemaDirPath;
            }
            else {
                throw new amplify_cli_core_1.AmplifyError('ApiCategorySchemaNotFoundError', {
                    message: 'No schema found',
                    resolution: `Your graphql schema should be in either ${schemaFilePath} or ${schemaDirPath}`,
                });
            }
            return this.schemaPath;
        };
        this.invalidateCachedSchema = () => {
            this.schemaPath = null;
            this.schemaDocument = null;
            this.preProcessedSchemaDocument = null;
        };
        this.readSchema = async (context, options, usePreProcessing = true) => {
            const preProcessSchema = usePreProcessing && (await amplify_cli_core_1.ApiCategoryFacade.getTransformerVersion(context)) === 2;
            if (!this.schemaDocument) {
                const fileContentsList = new Array();
                const resourceDir = await context_util_1.contextUtil.getResourceDir(context, options);
                const schemaPath = await this.getSchemaPath(resourceDir);
                const stats = fs.statSync(schemaPath);
                if (stats.isDirectory()) {
                    fs.readdirSync(schemaPath).forEach((fileName) => {
                        fileContentsList.push(fs.readFile(path_1.default.join(schemaPath, fileName)));
                    });
                }
                else {
                    fileContentsList.push(fs.readFile(schemaPath));
                }
                if (!fileContentsList.length) {
                    throw new amplify_cli_core_1.AmplifyError('ApiCategorySchemaNotFoundError', {
                        message: 'No schema found',
                        resolution: `Your graphql schema should be in ${schemaPath}`,
                    });
                }
                const bufferList = await Promise.all(fileContentsList);
                const fullSchema = bufferList.map((buff) => buff.toString()).join('\n');
                this.schemaDocument = (0, graphql_1.parse)(fullSchema);
            }
            if (preProcessSchema && !this.preProcessedSchemaDocument) {
                const transformerOptions = await (0, transformer_options_v2_1.generateTransformerOptions)(context, options);
                const transform = (0, graphql_transformer_1.constructTransform)(transformerOptions);
                this.preProcessedSchemaDocument = transform.preProcessSchema(this.schemaDocument);
            }
            return preProcessSchema ? this.preProcessedSchemaDocument : this.schemaDocument;
        };
    }
}
exports.SchemaReader = SchemaReader;
exports.schemaReader = new SchemaReader();
//# sourceMappingURL=schema-reader.js.map