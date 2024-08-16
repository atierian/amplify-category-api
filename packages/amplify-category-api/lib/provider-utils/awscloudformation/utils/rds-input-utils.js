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
exports.getEngineInput = exports.readRDSSchema = void 0;
const fs = __importStar(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const graphql_schema_generator_1 = require("@aws-amplify/graphql-schema-generator");
const graphql_transformer_core_1 = require("@aws-amplify/graphql-transformer-core");
const readRDSSchema = (pathToSchemaFile) => {
    if (!fs.existsSync(pathToSchemaFile)) {
        return;
    }
    const schemaContent = fs.readFileSync(pathToSchemaFile, 'utf-8');
    if (lodash_1.default.isEmpty(schemaContent)) {
        return;
    }
    return schemaContent;
};
exports.readRDSSchema = readRDSSchema;
const getEngineInput = (schemaDocument) => {
    var _a, _b;
    const inputNode = (0, graphql_schema_generator_1.readRDSGlobalAmplifyInput)(schemaDocument);
    if (inputNode) {
        const engine = (_b = (_a = inputNode.fields.find((field) => field.name.value === 'engine')) === null || _a === void 0 ? void 0 : _a.defaultValue) === null || _b === void 0 ? void 0 : _b.value;
        if (engine && !Object.values(graphql_transformer_core_1.ImportedRDSType).includes(engine)) {
            throw new Error(`engine input ${engine} is not supported.`);
        }
        return engine;
    }
    return graphql_transformer_core_1.ImportedRDSType.MYSQL;
};
exports.getEngineInput = getEngineInput;
//# sourceMappingURL=rds-input-utils.js.map