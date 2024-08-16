"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forceRefreshSchema = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const api_resource_paths_1 = require("./api-resource-paths");
const forceRefreshSchema = () => {
    const apiResourceDir = (0, api_resource_paths_1.getApiResourceDir)();
    const schemaFilePath = path_1.default.join(apiResourceDir, 'schema.graphql');
    const schemaDirectoryPath = path_1.default.join(apiResourceDir, 'schema');
    const schemaFileExists = fs_extra_1.default.existsSync(schemaFilePath);
    const schemaDirectoryExists = fs_extra_1.default.existsSync(schemaDirectoryPath);
    if (schemaFileExists) {
        fs_extra_1.default.appendFileSync(schemaFilePath, ' ');
    }
    else if (schemaDirectoryExists) {
        modifyGraphQLSchemaDirectory(schemaDirectoryPath);
    }
};
exports.forceRefreshSchema = forceRefreshSchema;
const modifyGraphQLSchemaDirectory = (schemaDirectoryPath) => {
    const files = fs_extra_1.default.readdirSync(schemaDirectoryPath);
    for (const fileName of files) {
        const isHiddenFile = fileName.indexOf('.') === 0;
        if (isHiddenFile) {
            continue;
        }
        const fullPath = path_1.default.join(schemaDirectoryPath, fileName);
        const stats = fs_extra_1.default.lstatSync(fullPath);
        if (stats.isDirectory() && modifyGraphQLSchemaDirectory(fullPath)) {
            return true;
        }
        if (stats.isFile()) {
            fs_extra_1.default.appendFileSync(fullPath, ' ');
            return true;
        }
    }
    return false;
};
//# sourceMappingURL=force-refresh-schema.js.map