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
exports.ApigwInputState = void 0;
const path_1 = require("path");
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const fs = __importStar(require("fs-extra"));
const cdk_stack_builder_1 = require("./cdk-stack-builder");
const convert_deprecated_apigw_paths_1 = require("./convert-deprecated-apigw-paths");
class ApigwInputState {
    constructor(context, resourceName) {
        this.context = context;
        this.addAdminQueriesResource = async (adminQueriesProps) => {
            this.resourceName = adminQueriesProps.apiName;
            this.paths = {
                '/{proxy+}': {
                    lambdaFunction: adminQueriesProps.functionName,
                    permissions: {
                        setting: cdk_stack_builder_1.PermissionSetting.PRIVATE,
                        auth: [cdk_stack_builder_1.CrudOperation.CREATE, cdk_stack_builder_1.CrudOperation.READ, cdk_stack_builder_1.CrudOperation.UPDATE, cdk_stack_builder_1.CrudOperation.DELETE],
                    },
                },
            };
            await this.createApigwArtifacts();
            const backendConfigs = {
                service: amplify_cli_core_1.AmplifySupportedService.APIGW,
                providerPlugin: 'awscloudformation',
                authorizationType: 'AMAZON_COGNITO_USER_POOLS',
                dependsOn: adminQueriesProps.dependsOn,
            };
            this.context.amplify.updateamplifyMetaAfterResourceAdd(amplify_cli_core_1.AmplifyCategories.API, adminQueriesProps.apiName, backendConfigs);
        };
        this.updateAdminQueriesResource = async (adminQueriesProps) => {
            this.resourceName = adminQueriesProps.apiName;
            this.paths = {
                '/{proxy+}': {
                    lambdaFunction: adminQueriesProps.functionName,
                    permissions: {
                        setting: cdk_stack_builder_1.PermissionSetting.PRIVATE,
                        auth: [cdk_stack_builder_1.CrudOperation.CREATE, cdk_stack_builder_1.CrudOperation.READ, cdk_stack_builder_1.CrudOperation.UPDATE, cdk_stack_builder_1.CrudOperation.DELETE],
                    },
                },
            };
            await this.createApigwArtifacts();
            this.context.amplify.updateamplifyMetaAfterResourceUpdate(amplify_cli_core_1.AmplifyCategories.API, adminQueriesProps.apiName, 'dependsOn', adminQueriesProps.dependsOn);
        };
        this.addApigwResource = async (serviceWalkthroughPromise, options) => {
            const { answers } = await serviceWalkthroughPromise;
            this.resourceName = answers.resourceName;
            this.paths = answers.paths;
            options.dependsOn = answers.dependsOn;
            (0, amplify_cli_core_1.isResourceNameUnique)(amplify_cli_core_1.AmplifyCategories.API, this.resourceName);
            await this.createApigwArtifacts();
            this.context.amplify.updateamplifyMetaAfterResourceAdd(amplify_cli_core_1.AmplifyCategories.API, this.resourceName, options);
            return this.resourceName;
        };
        this.updateApigwResource = async (updateWalkthroughPromise) => {
            const { answers } = await updateWalkthroughPromise;
            this.resourceName = answers.resourceName;
            this.paths = answers.paths;
            await this.createApigwArtifacts();
            this.context.amplify.updateamplifyMetaAfterResourceUpdate(amplify_cli_core_1.AmplifyCategories.API, this.resourceName, 'dependsOn', answers.dependsOn);
            return this.resourceName;
        };
        this.migrateAdminQueries = async (adminQueriesProps) => {
            var _a;
            this.resourceName = (_a = this.resourceName) !== null && _a !== void 0 ? _a : adminQueriesProps.apiName;
            if (!(await amplify_prompts_1.prompter.yesOrNo((0, amplify_cli_core_1.getMigrateResourceMessageForOverride)(amplify_cli_core_1.AmplifyCategories.API, this.resourceName, true), true))) {
                return;
            }
            const resourceDirPath = amplify_cli_core_1.pathManager.getResourceDirectoryPath(this.projectRootPath, amplify_cli_core_1.AmplifyCategories.API, this.resourceName);
            fs.removeSync((0, path_1.join)(resourceDirPath, amplify_cli_core_1.PathConstants.ParametersJsonFileName));
            fs.removeSync((0, path_1.join)(resourceDirPath, 'admin-queries-cloudformation-template.json'));
            return this.updateAdminQueriesResource(adminQueriesProps);
        };
        this.migrateApigwResource = async (resourceName) => {
            var _a;
            this.resourceName = (_a = this.resourceName) !== null && _a !== void 0 ? _a : resourceName;
            if (!(await amplify_prompts_1.prompter.yesOrNo((0, amplify_cli_core_1.getMigrateResourceMessageForOverride)(amplify_cli_core_1.AmplifyCategories.API, this.resourceName, true), true))) {
                return;
            }
            const deprecatedParametersFileName = 'api-params.json';
            const resourceDirPath = amplify_cli_core_1.pathManager.getResourceDirectoryPath(this.projectRootPath, amplify_cli_core_1.AmplifyCategories.API, this.resourceName);
            const deprecatedParametersFilePath = (0, path_1.join)(resourceDirPath, deprecatedParametersFileName);
            this.paths = (0, convert_deprecated_apigw_paths_1.convertDeperecatedRestApiPaths)(deprecatedParametersFileName, deprecatedParametersFilePath, this.resourceName);
            fs.removeSync(deprecatedParametersFilePath);
            fs.removeSync((0, path_1.join)(resourceDirPath, amplify_cli_core_1.PathConstants.ParametersJsonFileName));
            fs.removeSync((0, path_1.join)(resourceDirPath, `${this.resourceName}-cloudformation-template.json`));
            await this.createApigwArtifacts();
        };
        this.projectRootPath = amplify_cli_core_1.pathManager.findProjectRoot();
        this.resourceName = resourceName;
    }
    cliInputsFileExists() {
        return amplify_cli_core_1.stateManager.resourceInputsJsonExists(this.projectRootPath, amplify_cli_core_1.AmplifyCategories.API, this.resourceName);
    }
    getCliInputPayload() {
        return amplify_cli_core_1.stateManager.getResourceInputsJson(this.projectRootPath, amplify_cli_core_1.AmplifyCategories.API, this.resourceName);
    }
    async isCLIInputsValid(cliInputs) {
        if (!cliInputs) {
            cliInputs = this.getCliInputPayload();
        }
        const schemaValidator = new amplify_cli_core_1.CLIInputSchemaValidator(this.context, amplify_cli_core_1.AmplifySupportedService.APIGW, amplify_cli_core_1.AmplifyCategories.API, 'APIGatewayCLIInputs');
        await schemaValidator.validateInput(amplify_cli_core_1.JSONUtilities.stringify(cliInputs));
    }
    async createApigwArtifacts() {
        const resourceDirPath = amplify_cli_core_1.pathManager.getResourceDirectoryPath(this.projectRootPath, amplify_cli_core_1.AmplifyCategories.API, this.resourceName);
        fs.ensureDirSync(resourceDirPath);
        const buildDirPath = (0, path_1.join)(resourceDirPath, amplify_cli_core_1.PathConstants.BuildDirName);
        fs.ensureDirSync(buildDirPath);
        amplify_cli_core_1.stateManager.setResourceInputsJson(this.projectRootPath, amplify_cli_core_1.AmplifyCategories.API, this.resourceName, { version: 1, paths: this.paths });
        amplify_cli_core_1.stateManager.setResourceParametersJson(this.projectRootPath, amplify_cli_core_1.AmplifyCategories.API, this.resourceName, {});
        const stack = new cdk_stack_builder_1.ApigwStackTransform(this.context, this.resourceName, this);
        await stack.transform();
    }
}
exports.ApigwInputState = ApigwInputState;
//# sourceMappingURL=apigw-input-state.js.map