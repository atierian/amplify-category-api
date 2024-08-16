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
exports.migrateResourceToSupportOverride = void 0;
const path = __importStar(require("path"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const fs = __importStar(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const uuid_1 = require("uuid");
const auth_config_to_app_sync_auth_type_bi_di_mapper_1 = require("./auth-config-to-app-sync-auth-type-bi-di-mapper");
const resolver_config_to_conflict_resolution_bi_di_mapper_1 = require("./resolver-config-to-conflict-resolution-bi-di-mapper");
const migrateResourceToSupportOverride = async (resourceName) => {
    var _a;
    amplify_prompts_1.printer.debug('Starting Migration Process');
    const projectPath = amplify_cli_core_1.pathManager.findProjectRoot();
    if (!projectPath) {
        throw new Error('Project not initialized');
    }
    const apiresourceDirPath = amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, amplify_cli_core_1.AmplifyCategories.API, resourceName);
    const backupApiResourceFolder = backup(apiresourceDirPath, projectPath, resourceName);
    try {
        let resolverConfig = {};
        const transformConfig = (_a = amplify_cli_core_1.JSONUtilities.readJson(path.join(apiresourceDirPath, 'transform.conf.json'), { throwIfNotExist: false })) !== null && _a !== void 0 ? _a : {};
        if (!lodash_1.default.isEmpty(transformConfig) && !lodash_1.default.isEmpty(transformConfig.ResolverConfig)) {
            resolverConfig = transformConfig.ResolverConfig;
        }
        const authConfig = amplify_cli_core_1.stateManager.getMeta()[amplify_cli_core_1.AmplifyCategories.API][resourceName].output.authConfig;
        if (lodash_1.default.isEmpty(authConfig)) {
            throw new amplify_cli_core_1.ResourceDoesNotExistError(`auth configuration not present for ${resourceName}. Try amplify pull to sync your folder structure`);
        }
        const parameters = {
            authConfig,
            resolverConfig,
            resourceName,
        };
        const cliInputs = generateCliInputs(parameters);
        const cliInputsPath = path.join(apiresourceDirPath, 'cli-inputs.json');
        amplify_cli_core_1.JSONUtilities.writeJson(cliInputsPath, cliInputs);
        amplify_prompts_1.printer.debug('Migration is Successful');
    }
    catch (e) {
        amplify_prompts_1.printer.error('There was an error migrating your project.');
        rollback(apiresourceDirPath, backupApiResourceFolder);
        amplify_prompts_1.printer.debug('migration operations are rolled back.');
        throw e;
    }
    finally {
        cleanUp(backupApiResourceFolder);
    }
};
exports.migrateResourceToSupportOverride = migrateResourceToSupportOverride;
function backup(authresourcePath, projectPath, resourceName) {
    if (fs.existsSync(authresourcePath)) {
        const backupauthResourceDirName = `${resourceName}-BACKUP-${(0, uuid_1.v4)().split('-')[0]}`;
        const backupauthResourceDirPath = path.join(projectPath, backupauthResourceDirName);
        if (fs.existsSync(backupauthResourceDirPath)) {
            const error = new Error(`Backup folder at ${backupauthResourceDirPath} already exists, remove the folder and retry the operation.`);
            error.name = 'BackupFolderAlreadyExist';
            error.stack = undefined;
            throw error;
        }
        fs.copySync(authresourcePath, backupauthResourceDirPath);
        return backupauthResourceDirPath;
    }
}
function rollback(authresourcePath, backupauthResourceDirPath) {
    if (fs.existsSync(authresourcePath) && fs.existsSync(backupauthResourceDirPath)) {
        fs.removeSync(authresourcePath);
        fs.moveSync(backupauthResourceDirPath, authresourcePath);
    }
}
function cleanUp(authresourcePath) {
    if (!!authresourcePath && fs.existsSync(authresourcePath))
        fs.removeSync(authresourcePath);
}
const generateCliInputs = (parameters) => {
    return {
        version: 1,
        serviceConfiguration: {
            serviceName: 'AppSync',
            defaultAuthType: (0, auth_config_to_app_sync_auth_type_bi_di_mapper_1.authConfigToAppSyncAuthType)(parameters.authConfig ? parameters.authConfig.defaultAuthentication : undefined),
            additionalAuthTypes: !lodash_1.default.isEmpty(parameters.authConfig) && !lodash_1.default.isEmpty(parameters.authConfig.additionalAuthenticationProviders)
                ? parameters.authConfig.additionalAuthenticationProviders.map(auth_config_to_app_sync_auth_type_bi_di_mapper_1.authConfigToAppSyncAuthType)
                : undefined,
            conflictResolution: (0, resolver_config_to_conflict_resolution_bi_di_mapper_1.resolverConfigToConflictResolution)(parameters.resolverConfig),
            apiName: parameters.resourceName,
        },
    };
};
//# sourceMappingURL=migrate-api-override-resource.js.map